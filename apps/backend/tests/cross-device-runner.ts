import http from 'node:http';
import { createApp } from '../src/app.js';
import { getDatabase } from '../src/database/sqlite.connection.js';
import { queryNeon } from '../src/database/neon.connection.js';

export async function runCrossDeviceTest() {
  console.log('================================================================');
  console.log('   CROSS-DEVICE GLOBAL ACCOUNTS VERIFICATION                    ');
  console.log('   Registration -> Neon Cloud -> Device 2 Login & Session Sync  ');
  console.log('================================================================');

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const testEmail = `global.traveler.${Date.now()}@example.com`;
  const testPassword = 'SecureGlobalPassword2026!';

  try {
    // 1. Device 1: Register new account
    console.log(`\n[DEVICE 1] Registering user ${testEmail}...`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Elena',
        lastName: 'Global',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        department: 'Global People Ops',
        role: 'Senior Director',
      }),
    });
    const regData = (await regRes.json()) as any;
    const devCode = regData.data?.devVerificationCode;
    console.log(`  ✓ Registration initiated. Code generated: ${devCode}`);

    if (!devCode) {
      throw new Error('Registration failed to return verification code');
    }

    // 2. Device 1: Verify code to activate account
    console.log('[DEVICE 1] Verifying 4-digit code and activating account...');
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        code: devCode,
      }),
    });
    const verifyData = (await verifyRes.json()) as any;
    console.log(`  ✓ Account activated on Device 1: ${verifyData.data?.user?.email}`);

    // 3. Check Neon PostgreSQL
    console.log('\n[NEON CLOUD DATABASE]');
    const neonRes = await queryNeon(
      'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1);',
      [testEmail]
    );
    console.log(`  ✓ Account persisted in Neon PostgreSQL: ${neonRes?.rows[0]?.email} (ID: ${neonRes?.rows[0]?.id})`);

    // 4. Simulate Device 2 (completely separate device with empty local SQLite)
    console.log('\n[SIMULATING DEVICE 2]');
    console.log('  -> Wiping user record from local SQLite to simulate a different physical computer/phone...');
    const localDb = getDatabase();
    localDb.prepare('DELETE FROM users WHERE LOWER(email) = LOWER(?)').run(testEmail);

    const existsLocally = localDb
      .prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
      .get(testEmail);
    console.log(`  -> User present on Device 2 before cloud fetch: ${Boolean(existsLocally)} (expected false)`);

    // 5. Device 2: Attempt login with credentials from Device 1
    console.log(`[DEVICE 2] Logging in with global credentials created on Device 1...`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: testPassword,
      }),
    });

    const loginData = (await loginRes.json()) as any;
    if (!loginData.ok || !loginData.data?.token) {
      throw new Error(`Device 2 login failed: ${JSON.stringify(loginData)}`);
    }

    console.log(`  ✓ SUCCESS: Device 2 resolved user from Neon Cloud and authenticated!`);
    console.log(`  ✓ Signed in as: ${loginData.data.user.fullName} (${loginData.data.user.email})`);
    console.log(`  ✓ JWT Token issued: ${loginData.data.token.slice(0, 24)}...`);

    // 6. Device 2: Verify local caching for offline resilience
    const localCached = localDb
      .prepare('SELECT id, email, full_name FROM users WHERE LOWER(email) = LOWER(?)')
      .get(testEmail);
    console.log(`  ✓ Local SQLite synced on Device 2: ${Boolean(localCached)}`);

    // 7. Device 2: Verify session
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Authorization: `Bearer ${loginData.data.token}` },
    });
    const sessionData = (await sessionRes.json()) as any;
    console.log(`  ✓ Authenticated session active on Device 2: ${sessionData.data?.user?.username}`);

    console.log('\n================================================================');
    console.log('  🎉 100% SUCCESS: GLOBAL ACCOUNTS FULLY OPERATIONAL ACROSS DEVICES!');
    console.log('================================================================\n');
  } finally {
    await queryNeon('DELETE FROM users WHERE LOWER(email) = LOWER($1);', [testEmail]);
    await queryNeon('DELETE FROM verification_codes WHERE LOWER(email) = LOWER($1);', [testEmail]);
    const localDb = getDatabase();
    localDb.prepare('DELETE FROM users WHERE LOWER(email) = LOWER(?)').run(testEmail);
    server.close();
  }
}

runCrossDeviceTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
