import crypto from 'node:crypto';
import http2 from 'node:http2';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createApnsJwt() {
  const teamId = process.env.APNS_TEAM_ID;
  const keyId = process.env.APNS_KEY_ID;
  const privateKeyB64 = process.env.APNS_PRIVATE_KEY_BASE64;
  if (!teamId || !keyId || !privateKeyB64) return null;

  const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
  const header = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${base64url(signature)}`;
}

function sendToDevice(deviceToken: string, jwt: string, payload: object): Promise<{ status: number; token: string }> {
  return new Promise((resolve) => {
    const apnsHost = process.env.APNS_ENV === 'sandbox' ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
    const bundleId = process.env.APNS_BUNDLE_ID || '';
    let client: http2.ClientHttp2Session;
    try {
      client = http2.connect(apnsHost);
    } catch {
      resolve({ status: 0, token: deviceToken });
      return;
    }

    client.on('error', () => resolve({ status: 0, token: deviceToken }));

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    });

    let status = 0;
    req.on('response', (headers) => {
      status = Number(headers[':status'] || 0);
    });
    req.on('data', () => {});
    req.on('end', () => {
      client.close();
      resolve({ status, token: deviceToken });
    });
    req.on('error', () => {
      client.close();
      resolve({ status: 0, token: deviceToken });
    });

    req.end(JSON.stringify(payload));
  });
}

/**
 * Sends a push notification to every registered iPhone. Safe to call from
 * anywhere: if push notifications aren't configured yet, or anything fails,
 * it silently does nothing rather than breaking article publishing.
 */
export async function sendPushToAllDevices(title: string, body: string, url?: string | null) {
  try {
    const jwt = createApnsJwt();
    if (!jwt) return; // APNs env vars not set up yet

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return;

    const supabase = createServiceClient(supabaseUrl, serviceKey);
    const { data: tokens } = await supabase.from('device_tokens').select('device_token');
    if (!tokens || tokens.length === 0) return;

    const payload = {
      aps: { alert: { title, body }, sound: 'default' },
      url: url || null,
    };

    const results = await Promise.all(tokens.map((t) => sendToDevice(t.device_token, jwt, payload)));

    const deadTokens = results.filter((r) => r.status === 400 || r.status === 410).map((r) => r.token);
    if (deadTokens.length) {
      await supabase.from('device_tokens').delete().in('device_token', deadTokens);
    }
  } catch {
    // Push notifications are best-effort. Never let this break publishing.
  }
}
