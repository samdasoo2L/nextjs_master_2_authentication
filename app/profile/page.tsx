import { notFound, redirect } from "next/navigation";
import db from "../lib/db";
import getSession from "../lib/session";

async function getUser() {
  const session = await getSession();
  if (session.id) {
    const user = await db.user.findUnique({
      where: { id: session.id },
    });
    if (user) {
      return user;
    }
  }
  notFound();
}

export default async function Profile() {
  const user = await getUser();
  const logOut = async () => {
    // 서버 컴포넌트는 기본적으로 "use server"이기에 써줄 필요가 없다.
    // 서버 액션은 디폴트가 없기에 "use server"를 꼭 써야한다.
    "use server";
    const session = await getSession();
    session.destroy();
    redirect("/");
  };
  return (
    <div>
      <h1>welcome! {user?.username}!</h1>
      <form action={logOut}>
        <button>Log out</button>
      </form>
    </div>
  );
}
