import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.webfitnews.app',
        sha256_cert_fingerprints: ['PASTE_YOUR_FINGERPRINT_HERE'],
      },
    },
  ]);
}