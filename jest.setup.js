require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

const nodeCrypto = require('crypto');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
if (typeof global.Request === 'undefined' && typeof globalThis.Request !== 'undefined') {
  global.Request = globalThis.Request;
}
if (typeof global.Response === 'undefined' && typeof globalThis.Response !== 'undefined') {
  global.Response = globalThis.Response;
}
if (typeof global.Headers === 'undefined' && typeof globalThis.Headers !== 'undefined') {
  global.Headers = globalThis.Headers;
}
if (nodeCrypto.webcrypto && (!global.crypto || !global.crypto.subtle)) {
  Object.defineProperty(global, 'crypto', {
    value: nodeCrypto.webcrypto,
    writable: true,
    configurable: true,
  });
}

if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );
}