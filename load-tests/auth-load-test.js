import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

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
    http_req_duration: ['p(95)<3000'],
    errors:            ['rate<0.2'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const PARAMS = { headers: { 'Content-Type': 'application/json' } };

const NEGATIVE_PARAMS = {
  headers: { 'Content-Type': 'application/json' },
  tags: { expected_failure: 'true' },
  responseCallback: http.expectedStatuses({ min: 400, max: 499 }),
};

export function setup() {
  const email = `loadtest_${Date.now()}@example.com`;

  const res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email,
      password:            'Password123',
      publicKey:           'test_public_key',
      encryptedPrivateKey: 'test_encrypted_private_key',
      kdfSalt:             'test_salt',
      iv:                  'test_iv',
    }),
    PARAMS,
  );

  if (!check(res, { 'setup: register successful': (r) => r.status === 201 })) {
    console.error(`Setup failed — status ${res.status}`);
    return null;
  }

  return { email, password: 'Password123' };
}

export default function (data) {
  if (!data) return;

  if (__VU % 10 < 7) {
    happyPath(data);
  } else {
    negativeScenarios(data);
  }

  sleep(1);
}

function happyPath(data) {
  group('login', () => {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: data.email, password: data.password }),
      PARAMS,
    );

    const ok = check(res, {
      'login: status 201':    (r) => r.status === 201,
      'login: returns token': (r) => {
        try { return !!JSON.parse(r.body).details?.accessToken; }
        catch { return false; }
      },
    });

    errorRate.add(!ok);
  });
}

function negativeScenarios(data) {
  group('wrong password', () => {
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: data.email, password: 'WrongPassword' }),
      NEGATIVE_PARAMS,
    );

    check(res, {
      'wrong password: відхилено (4xx)': (r) => r.status >= 400 && r.status < 500,
      'wrong password: не 500':          (r) => r.status < 500,
    });

    errorRate.add(res.status >= 500);
  });

  sleep(0.3);

  group('duplicate registration', () => {
    const res = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        email:               data.email,
        password:            'Password123',
        publicKey:           'test_public_key',
        encryptedPrivateKey: 'test_encrypted_private_key',
        kdfSalt:             'test_salt',
        iv:                  'test_iv',
      }),
      NEGATIVE_PARAMS,
    );

    check(res, {
      'duplicate reg: не 201':  (r) => r.status !== 201,
      'duplicate reg: не 500':  (r) => r.status < 500,
    });

    errorRate.add(res.status >= 500);
  });
}

export function teardown(data) {
  if (data) console.log(`Done. Test user: ${data.email}`);
}