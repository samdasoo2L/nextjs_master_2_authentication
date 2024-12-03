import { NextRequest, NextResponse } from "next/server";
import getSession from "./lib/session";

interface Routes {
  [key: string]: boolean;
}

const publicOnlyUrls: Routes = {
  "/": true,
  "/login": true,
  "/sms": true,
  "/create-account": true,
};

// middleware라는 파일 명이 중요하다. (경로도, 함수명도)
export async function middleware(request: NextRequest) {
  const session = await getSession();
  const exists = publicOnlyUrls[request.nextUrl.pathname];
  if (!session.id) {
    // 로그인 안된 상태
    if (!exists) {
      // 로그인 해야 갈 수 있는 곳 막기
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    // 로그인 된 상태
    if (exists) {
      // 로그인 안되어 있어야 갈 수 있는 곳 막기
      return NextResponse.redirect(new URL("/products", request.url));
    }
  }
}

// 사실상 원치않는 URL 사전 차단 용도로 많이 쓰임
export const config = {
  // 아래 url만 허용하겠다.
  //   match: ["/", "/profile", "/create-account", "/user/:path*"],
  // 아래는 제외하고자 하는 것들을 의미 !
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// + 미들웨어는 Edge런타임과 호환되는 API만 지원한다.
// 요약 : 무거운건 안된다. (Prisma X)
// Edge런타임 : node.js API 경량버전
// 미들웨어는 모든 단일 req에 대해 실행되어야 한다.
