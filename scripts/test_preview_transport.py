import io
import json
import os
import subprocess
import tempfile
import unittest
import urllib.error
from email.message import Message
from pathlib import Path
from preview_transport import fetch_preview, TransportError, origin

PREVIEW = 'https://salora-platform-fixture.vercel.app'
CANARY = 'TEST_AUTH_CANARY'

class ControlledTransport:
    def __init__(self, locations):
        self.locations = list(locations)
        self.requests = []
    def open(self, request, timeout):
        self.requests.append(request)
        if self.locations:
            headers = Message()
            headers['Location'] = self.locations.pop(0)
            raise urllib.error.HTTPError(request.full_url, 302, 'fixture', headers, io.BytesIO())
        return Response()

class Response:
    status = 200
    headers = Message()
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def read(self): return b'<html>fixture</html>'

class DiscoveryTests(unittest.TestCase):
    def run_fixture(self, locations, expected=None):
        transport = ControlledTransport(locations)
        with tempfile.TemporaryDirectory() as directory:
            if expected:
                with self.assertRaisesRegex(TransportError, '^' + expected + '$'):
                    fetch_preview(PREVIEW, CANARY, directory, transport)
            else:
                fetch_preview(PREVIEW, CANARY, directory, transport)
            raw = (Path(directory) / 'redirect-discovery.json').read_text()
            artifact = json.loads(raw)
        for secret in (CANARY, 'query-secret', 'fragment-secret', 'user-secret', 'password-secret', '?', '#', '@'):
            self.assertNotIn(secret, raw)
        for request in transport.requests:
            self.assertEqual(origin(request.full_url), PREVIEW + ':443')
            self.assertEqual(request.get_header('X-vercel-trusted-oidc-idp-token'), CANARY)
        return transport, artifact

    def test_unapproved_origin_is_recorded_without_following(self):
        transport, artifact = self.run_fixture(['https://other.invalid/path?token=query-secret#fragment-secret'], 'REDIRECT_TARGET_REJECTED')
        self.assertEqual(len(transport.requests), 1)
        self.assertEqual(artifact['redirects'][0], {
            'hop': 1, 'status': 302, 'sourceOrigin': PREVIEW + ':443',
            'destinationOrigin': 'https://other.invalid:443', 'sameOrigin': False,
            'allowed': False, 'decision': 'REJECT', 'credentialForwarded': False,
        })

    def test_relative_same_origin_then_unapproved_does_not_inherit_trust(self):
        transport, artifact = self.run_fixture(['/next?token=query-secret', 'https://evil.invalid/'], 'REDIRECT_TARGET_REJECTED')
        self.assertEqual(len(transport.requests), 2)
        self.assertEqual([r['allowed'] for r in artifact['redirects']], [True, False])

    def test_same_origin_normalizes_case_and_default_port(self):
        transport, artifact = self.run_fixture(['https://SALORA-PLATFORM-FIXTURE.vercel.app:443/next'])
        self.assertEqual(len(transport.requests), 2)
        self.assertTrue(artifact['redirects'][0]['sameOrigin'])
        self.assertEqual(artifact['finalDecision'], 'ALLOW')

    def test_negative_boundaries(self):
        cases = [
            ('http://salora-platform-fixture.vercel.app/', 'PROTOCOL_DOWNGRADE_REJECTED'),
            ('https://user-secret:password-secret@salora-platform-fixture.vercel.app/', 'REDIRECT_TARGET_REJECTED'),
            (PREVIEW + '.evil.invalid/', 'REDIRECT_TARGET_REJECTED'),
            (PREVIEW + ':8443/', 'REDIRECT_TARGET_REJECTED'),
            (PREVIEW + ':invalid/', 'REDIRECT_TARGET_REJECTED'),
            ('https://[malformed?token=query-secret', 'REDIRECT_TARGET_REJECTED'),
            ('https://salorа-platform-fixture.vercel.app/', 'REDIRECT_TARGET_REJECTED'),
        ]
        for location, code in cases:
            with self.subTest(code=code):
                transport, artifact = self.run_fixture([location], code)
                self.assertEqual(len(transport.requests), 1)
                self.assertFalse(artifact['redirects'][0]['allowed'])

    def test_artifact_scanner_accepts_sanitized_discovery_and_rejects_canary(self):
        scanner = Path(__file__).with_name('scan-certification-artifacts.mjs').resolve()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'certification'
            with self.assertRaises(TransportError):
                fetch_preview(PREVIEW, CANARY, output, ControlledTransport([
                    'https://other.invalid/?token=query-secret#fragment-secret']))
            env = dict(os.environ, VERCEL_TRUSTED_OIDC_TOKEN=CANARY)
            clean = subprocess.run(['node', str(scanner)], cwd=directory, env=env, capture_output=True)
            self.assertEqual(clean.returncode, 0)
            (output / 'contaminated.txt').write_text(CANARY)
            dirty = subprocess.run(['node', str(scanner)], cwd=directory, env=env, capture_output=True)
            self.assertNotEqual(dirty.returncode, 0)
            self.assertNotIn(CANARY.encode(), dirty.stdout + dirty.stderr)

    def test_redirect_limit_remains_five(self):
        transport, artifact = self.run_fixture(['/next'] * 6, 'REDIRECT_LIMIT_EXCEEDED')
        self.assertEqual(len(transport.requests), 6)
        self.assertFalse(artifact['redirects'][-1]['allowed'])

if __name__ == '__main__':
    unittest.main()
