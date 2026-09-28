"""Exact-origin transport. Discovery never grants navigation or credential trust."""
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

MAX_REDIRECTS = 5

class TransportError(Exception):
    pass

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def origin(value):
    try:
        p = urllib.parse.urlsplit(value)
        host = (p.hostname or '').lower()
        port = p.port or (443 if p.scheme == 'https' else 80)
        # Only structural ASCII DNS metadata is eligible for diagnostic output.
        if not re.fullmatch(r'[a-z0-9.-]+', host):
            raise ValueError()
        return f'{p.scheme}://{host}:{port}'
    except ValueError:
        return None

def problem(value, approved):
    try:
        p = urllib.parse.urlsplit(value)
        if p.scheme != 'https':
            return 'PROTOCOL_DOWNGRADE_REJECTED'
        if p.username is not None or p.password is not None:
            return 'REDIRECT_TARGET_REJECTED'
        if p.port not in (None, 443) or origin(value) != approved:
            return 'REDIRECT_TARGET_REJECTED'
    except ValueError:
        return 'REDIRECT_TARGET_REJECTED'
    return None

def fetch_preview(preview, token, output, opener=None):
    approved = origin(preview)
    p = urllib.parse.urlsplit(preview)
    if (not approved or problem(preview, approved) or
        not re.fullmatch(r'salora-platform-[a-z0-9-]+\.vercel\.app', p.hostname or '') or
        p.path not in ('', '/') or p.query or p.fragment):
        raise TransportError('PREVIEW_ORIGIN_MISMATCH')
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    discovery = {'initialOrigin': approved, 'redirects': [], 'finalDecision': 'PENDING'}
    def save(decision):
        discovery['finalDecision'] = decision
        (output / 'redirect-discovery.json').write_text(json.dumps(discovery, indent=2) + '\n')
    def reject(code):
        save(code)
        raise TransportError(code)
    client = opener or urllib.request.build_opener(NoRedirect)
    current = preview.rstrip('/') + '/menu?category=matcha'
    for hop in range(MAX_REDIRECTS + 1):
        if problem(current, approved):
            reject('REDIRECT_TARGET_REJECTED')
        req = urllib.request.Request(current, headers={
            'x-vercel-trusted-oidc-idp-token': token,
            'User-Agent': 'salora-preview-certification/1',
            'Accept': 'text/html,application/xhtml+xml',
        }, method='GET')
        try:
            with client.open(req, timeout=30) as response:
                status, headers, body = response.status, response.headers, response.read()
            save('ALLOW')
            return status, headers, body, current, discovery['redirects']
        except urllib.error.HTTPError as exc:
            try:
                if exc.code not in (301, 302, 303, 307, 308):
                    reject('AUTHENTICATION_FAILED' if exc.code in (401, 403) else 'INVALID_FINAL_STATUS')
                location = exc.headers.get('Location')
                try:
                    if not location:
                        raise ValueError()
                    target = urllib.parse.urljoin(current, location)
                    destination = origin(target)
                    code = problem(target, approved)
                except ValueError:
                    destination, code = None, 'REDIRECT_TARGET_REJECTED'
                if hop >= MAX_REDIRECTS:
                    code = 'REDIRECT_LIMIT_EXCEEDED'
                discovery['redirects'].append({
                    'hop': hop + 1, 'status': exc.code,
                    'sourceOrigin': origin(current), 'destinationOrigin': destination,
                    'sameOrigin': destination == approved,
                    'allowed': code is None, 'decision': 'REJECT' if code else 'ALLOW',
                    'credentialForwarded': False,
                })
                save(code or 'ALLOW')
                if code:
                    reject(code)
                current = target
            finally:
                exc.close()
        except (urllib.error.URLError, OSError, ValueError):
            reject('PREVIEW_RESOLUTION_FAILED')
    reject('REDIRECT_LIMIT_EXCEEDED')
