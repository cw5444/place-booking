import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 보안 체크 없이 통과
  return NextResponse.next();
}

export const config = {
  // matcher 부분을 바꾼 폴더명에 맞게 수정합니다.
  matcher: ['/admin-at-your-feet-2024-secure-access/:path*'],
};
