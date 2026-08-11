import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const serviceWorkerSource = fs.readFileSync(new URL('../jfk/sw.js', import.meta.url), 'utf8');
const listeners = new Map();
const cacheWrites = [];
const cachedResponses = new Map();
let fetchImplementation = async () => {
  throw new Error('fetch implementation was not configured');
};

const cache = {
  async addAll() {},
  async put(request, response) {
    cacheWrites.push({ request, response });
    cachedResponses.set(request.url || request, response);
  }
};

const context = vm.createContext({
  URL,
  Promise,
  console,
  fetch: (request) => fetchImplementation(request),
  caches: {
    async open() {
      return cache;
    },
    async keys() {
      return [];
    },
    async delete() {
      return true;
    },
    async match(request) {
      return cachedResponses.get(request.url || request);
    }
  },
  self: {
    registration: { scope: 'https://example.test/clinical-dashboards/jfk/' },
    location: { origin: 'https://example.test' },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    skipWaiting() {},
    clients: { claim: async () => {} }
  }
});

vm.runInContext(serviceWorkerSource, context, { filename: 'jfk/sw.js' });

assert.match(
  serviceWorkerSource,
  /workflows-v2-2026-08-11-network-refresh/,
  'the JFK workflows cache version must identify the network-refresh release'
);

const request = {
  method: 'GET',
  mode: 'navigate',
  url: 'https://example.test/clinical-dashboards/jfk/workflows.html'
};
const onlineResponse = {
  status: 200,
  type: 'basic',
  clone() {
    return { source: 'online-copy' };
  }
};

fetchImplementation = async () => onlineResponse;
let responsePromise;
const backgroundWork = [];
listeners.get('fetch')({
  request,
  respondWith(promise) {
    responsePromise = promise;
  },
  waitUntil(promise) {
    backgroundWork.push(promise);
  }
});

assert.equal(await responsePromise, onlineResponse, 'online navigation should return the network response');
await Promise.all(backgroundWork);
assert.equal(cacheWrites.length, 1, 'online navigation should refresh the saved offline page');
assert.equal(cacheWrites[0].request, request, 'the requested page should be cached under its own URL');

const offlineResponse = { source: 'saved-offline-copy' };
cachedResponses.set(request.url, offlineResponse);
fetchImplementation = async () => {
  throw new Error('offline');
};
responsePromise = undefined;
listeners.get('fetch')({
  request,
  respondWith(promise) {
    responsePromise = promise;
  },
  waitUntil() {}
});

assert.equal(await responsePromise, offlineResponse, 'offline navigation should use the newest saved copy');
console.log('JFK PWA cache guard passed.');
