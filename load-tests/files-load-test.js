import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate       = new Rate('errors');
const uploadDuration  = new Trend('upload_request_duration', true);
const downloadDuration = new Trend('download_request_duration', true);
const listDuration    = new Trend('list_files_duration', true);

export const options = {
  stages: [
    { duration: '30s', target: 10  }, 
    { duration: '1m',  target: 10  }, 
    { duration: '30s', target: 50  }, 
    { duration: '1m',  target: 50  }, 
    { duration: '30s', target: 100 }, 
    { duration: '1m',  target: 100 }, 
    { duration: '30s', target: 150 }, 
    { duration: '1m',  target: 150 }, 
    { duration: '30s', target: 0   }, 
  ],
  thresholds: {
    http_req_duration:       ['p(95)<3000'],
    errors:                  ['rate<0.2'],
    upload_request_duration: ['p(95)<3000'],
    download_request_duration: ['p(95)<3000'],
    list_files_duration:     ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const NEGATIVE_PARAMS = (token) => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  tags: { expected_failure: 'true' },
  responseCallback: http.expectedStatuses({ min: 400, max: 499 }),
});

const authHeaders = (token) => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
});

export function setup() {
  const email = `loadtest_files_${Date.now()}@example.com`;

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email,
      password:            'Password123',
      publicKey:           'test_public_key',
      encryptedPrivateKey: 'test_encrypted_private_key',
      kdfSalt:             'test_salt',
      iv:                  'test_iv',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!check(registerRes, { 'setup: register successful': (r) => r.status === 201 })) {
    console.error(`Setup failed — status ${registerRes.status}`);
    return null;
  }

  const token = JSON.parse(registerRes.body).accessToken;

  const uploadRes = http.post(
    `${BASE_URL}/files/upload-request`,
    JSON.stringify({
      name:             'seed-file.txt',
      encryptedFileKey: 'test_encrypted_key',
      fileIv:           'test_file_iv',
      mimeType:         'text/plain',
      size:             1024,
    }),
    authHeaders(token),
  );

  const seedFileId = uploadRes.status === 201
    ? JSON.parse(uploadRes.body).fileId
    : null;

  console.log(`Setup complete. User: ${email}, seed fileId: ${seedFileId}`);
  return { token, seedFileId };
}

export default function (data) {
  if (!data) return;

  const scenario = __VU % 3;

  if (scenario === 0) happyPath(data);
  else if (scenario === 1) negativeScenarios(data);
  else listFilesPath(data);

  sleep(1);
}

function happyPath(data) {
  let fileId = data.seedFileId;

  group('upload request', () => {
    const res = http.post(
      `${BASE_URL}/files/upload-request`,
      JSON.stringify({
        name:             `test-file-${Date.now()}.txt`,
        encryptedFileKey: 'test_encrypted_key',
        fileIv:           'test_file_iv',
        mimeType:         'text/plain',
        size:             1024,
      }),
      authHeaders(data.token),
    );

    uploadDuration.add(res.timings.duration);

    const ok = check(res, {
      'upload: status 201':         (r) => r.status === 201,
      'upload: returns fileId':     (r) => !!JSON.parse(r.body).fileId,
      'upload: returns uploadUrl':  (r) => !!JSON.parse(r.body).uploadUrl,
    });

    errorRate.add(!ok);

    if (ok) fileId = JSON.parse(res.body).fileId;
  });

  sleep(0.5);

  if (fileId) {
    group('download request', () => {
      const res = http.post(
        `${BASE_URL}/files/download-request/${fileId}`,
        null,
        authHeaders(data.token),
      );

      downloadDuration.add(res.timings.duration);

      const ok = check(res, {
        'download: status 201':           (r) => r.status === 201,
        'download: returns downloadUrl':  (r) => !!JSON.parse(r.body).downloadUrl,
      });

      errorRate.add(!ok);
    });
  }
}

function listFilesPath(data) {
  group('list files', () => {
    const res = http.get(`${BASE_URL}/files`, authHeaders(data.token));

    listDuration.add(res.timings.duration);

    const ok = check(res, {
      'list: status 200':       (r) => r.status === 200,
      'list: returns array':    (r) => {
        try { return Array.isArray(JSON.parse(r.body)); }
        catch { return false; }
      },
    });

    errorRate.add(!ok);
  });
}

function negativeScenarios(data) {

  group('upload: no auth', () => {
    const res = http.post(
      `${BASE_URL}/files/upload-request`,
      JSON.stringify({
        name: 'hack.txt', encryptedFileKey: 'x', fileIv: 'x', mimeType: 'text/plain', size: 1,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { expected_failure: 'true' },
        responseCallback: http.expectedStatuses({ min: 400, max: 499 }),
      },
    );

    check(res, {
      'no auth: відхилено (4xx)': (r) => r.status >= 400 && r.status < 500,
      'no auth: не 500':          (r) => r.status < 500,
    });

    errorRate.add(res.status >= 500);
  });

  sleep(0.3);

  group('download: file not found', () => {
    const res = http.post(
      `${BASE_URL}/files/download-request/00000000-0000-0000-0000-000000000000`,
      null,
      NEGATIVE_PARAMS(data.token),
    );

    check(res, {
      'not found: status 404':  (r) => r.status === 404,
      'not found: не 500':      (r) => r.status < 500,
    });

    errorRate.add(res.status >= 500);
  });

  sleep(0.3);

  group('upload: missing fields', () => {
    const res = http.post(
      `${BASE_URL}/files/upload-request`,
      JSON.stringify({ name: 'incomplete.txt' }),
      NEGATIVE_PARAMS(data.token),
    );

    check(res, {
      'missing fields: status 400 або 422': (r) => r.status === 400 || r.status === 422,
      'missing fields: не 500':             (r) => r.status < 500,
    });

    errorRate.add(res.status >= 500);
  });
}

export function teardown(data) {
  if (data) console.log(`Done. seed fileId: ${data.seedFileId}`);
}