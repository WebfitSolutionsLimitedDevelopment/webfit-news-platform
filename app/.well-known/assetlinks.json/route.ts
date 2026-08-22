import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.webfitnews.app',
        sha256_cert_fingerprints: ['96:DC:84:6D:1A:2D:E0:B7:54:E9:80:66:D7:3E:45:70:16:80:20:7A:C1:05:B7:CD:7F:F3:4A:C8:A0:EF:42:94'],
      },
    },
  ]);
}