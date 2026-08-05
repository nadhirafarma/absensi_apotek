// Test suite PBKDF2 standard vectors (RFC 6070). Run: node tools/test_pbkdf2.js
const assert = require("assert");

// Mock Utility digest/signature logic from Google Apps Script to run locally in Node
function computeHmacSha256Signature(textBytes, keyBytes) {
  const crypto = require("crypto");
  const key = Buffer.from(keyBytes);
  const text = Buffer.from(textBytes);
  const sig = crypto.createHmac("sha256", key).update(text).digest();
  return Array.from(sig).map(b => b > 127 ? b - 256 : b); // Convert to signed byte array matching Apps Script
}

function pbkdf2HmacSha256Mock(password, salt, iterations) {
  const hmac = function(keyBytes, textBytes) {
    return computeHmacSha256Signature(textBytes, keyBytes);
  };

  const passBytes = Array.from(Buffer.from(password, "utf8")).map(b => b > 127 ? b - 256 : b);
  const saltBytes = Array.from(Buffer.from(salt, "utf8")).map(b => b > 127 ? b - 256 : b);

  const blockIndexBytes = [0, 0, 0, 1];
  const seedBytes = saltBytes.concat(blockIndexBytes);

  let ui = hmac(passBytes, seedBytes);
  const xorSum = ui.slice();

  for (let i = 1; i < iterations; i += 1) {
    ui = hmac(passBytes, ui);
    for (let j = 0; j < 32; j += 1) {
      xorSum[j] ^= ui[j];
    }
  }

  // base64url encode signed bytes sum
  const u8Array = new Uint8Array(xorSum.map(b => b < 0 ? b + 256 : b));
  return Buffer.from(u8Array).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// RFC 6070 / Standard verification vectors (iteration scaled down for rapid test)
try {
  console.log("Running PBKDF2 HMAC-SHA256 signature test...");

  const crypto = require("crypto");
  const toBase64Url = bytes => Buffer.from(bytes).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  // Compare the Apps Script-shaped implementation with Node's independent PBKDF2-HMAC-SHA256 primitive.
  const cases = [1, 2, 4096];
  cases.forEach(iterations => {
    const actual = pbkdf2HmacSha256Mock("password", "salt", iterations);
    const expected = toBase64Url(crypto.pbkdf2Sync("password", "salt", iterations, 32, "sha256"));
    assert.strictEqual(actual, expected, `PBKDF2 mismatch at ${iterations} iterations`);
  });

  // Wrong password must never produce the same derived key.
  assert.notStrictEqual(
    pbkdf2HmacSha256Mock("wrong-password", "salt", 2),
    toBase64Url(crypto.pbkdf2Sync("password", "salt", 2, 32, "sha256"))
  );

  console.log("✓ PBKDF2 HMAC-SHA256 vector test: OK");
} catch(e) {
  console.error("✗ PBKDF2 HMAC-SHA256 vector test: FAILED");
  console.error(e);
  process.exit(1);
}
