import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionContent {
  id?: number;
}

export default function getSession() {
  // 세션 가져오는 방법
  // 클라이언트가 전달해준 쿠키를
  // 쿠키이름과 비밀번호로 해독한다
  // 이걸 리턴해준다. 이게 세션이야.
  return getIronSession<SessionContent>(cookies(), {
    cookieName: "delicious-karrot",
    password: process.env.COOKIE_PASSWORD!,
  });
}
