import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTH_HEADER, previewBoundary } from "./preview-auth-boundary.mjs";
const origin = "https://salora-platform-controlled.vercel.app";
const identity = { deploymentUrl: origin, environment: "preview", deploymentId: "dpl_fixture" };
const canary = "TEST_AUTH_CANARY";
const response = (status = 200, location) => ({ status: () => status, headers: () => ({ location }), dispose: async () => {} });

test("approved requests and same-origin redirect attach synthetic credential per hop", async () => {
  const boundary = previewBoundary(identity, canary), observed = [];
  await boundary.fetch(origin, {}, async (url, options) => {
    observed.push({ url, options });
    return observed.length === 1 ? response(302, "/next") : response();
  });
  assert.equal(observed.length, 2);
  for (const { options } of observed) {
    assert.equal(options.headers[AUTH_HEADER], canary);
    assert.equal(options.maxRedirects, 0);
  }
});
test("public cross-origin request strips inherited credential case-insensitively", async () => {
  const boundary = previewBoundary(identity, canary);
  await boundary.fetch("https://assets.example.invalid/a", { headers: { [AUTH_HEADER.toUpperCase()]: canary } }, async (url, options) => {
    assert.equal(Object.keys(options.headers).some(key => key.toLowerCase() === AUTH_HEADER), false);
    assert.equal(JSON.stringify(options).includes(canary), false);
    return response();
  }, false);
});
for (const [name, destination, code] of [
  ["cross origin", "https://other.example.invalid/", "CROSS_ORIGIN_AUTH_BLOCKED"],
  ["downgrade", "http://salora-platform-controlled.vercel.app/", "PROTOCOL_DOWNGRADE_REJECTED"],
  ["userinfo", "https://user@salora-platform-controlled.vercel.app/", "AUTH_SCOPE_REJECTED"],
  ["host confusion", origin + ".evil.invalid/", "CROSS_ORIGIN_AUTH_BLOCKED"],
]) test(name + " redirect is rejected before destination execution", async () => {
  let sends = 0;
  await assert.rejects(previewBoundary(identity, canary).fetch(origin, {}, async () => {
    sends++;
    return response(302, destination);
  }), { message: code });
  assert.equal(sends, 1);
});
test("unapproved top-level URL never executes and transport errors cannot reveal token", async () => {
  const boundary = previewBoundary(identity, canary);
  await assert.rejects(boundary.fetch(origin + ".evil.invalid", {}, () => assert.fail("must not send")), /PREVIEW_ORIGIN_MISMATCH/);
  await assert.rejects(boundary.fetch(origin, {}, () => { throw new Error(canary); }), { message: "AUTHENTICATION_TRANSPORT_FAILED" });
});
