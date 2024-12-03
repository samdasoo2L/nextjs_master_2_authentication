"use server";

import bcrypt from "bcrypt";
import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_REGEX_ERROR,
} from "../lib/constants";
import db from "../lib/db";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import getSession from "../lib/session";

const checkUsername = (username: string) => !username.includes("potato");

// const checkUniqueUsername = async (username: string) => {
//   const user = await db.user.findUnique({
//     where: { username },
//     select: { id: true },
//   });
//   // if (user) {
//   //   return false;
//   // } else {
//   //   return true;
//   // }
//   return !Boolean(user);
// };

// const checkUniqueEmail = async (email: string) => {
//   const user = await db.user.findUnique({
//     where: { email },
//     select: { id: true },
//   });
//   return Boolean(user) === false; // === !Boolean(user)
// };

const checkPasswords = ({
  password,
  confirm_password,
}: {
  password: string;
  confirm_password: string;
}) => password === confirm_password;

// const usernameSchema = z.string().min(5).max(10);
// validation 확인 사항
const formSchema = z
  .object({
    username: z
      .string({
        invalid_type_error: "Username must be a string!",
        required_error: "Where is my username??",
      })
      .trim()
      .toLowerCase()
      // .transform((username) => `🔥 ${username}`)
      // .refine(
      //   (username) => !username.includes("potato"),
      //   "No potatoes allowed!"
      // )
      .refine(checkUsername, "No potatoes allowed!"),
    // .refine(checkUniqueUsername, "This username is already taken"),
    email: z.string().email().toLowerCase(),
    // .refine(
    //   checkUniqueEmail,
    //   "There is an account already registered with that email."
    // ),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    // .regex(PASSWORD_REGEX, PASSWORD_REGEX_ERROR),
    confirm_password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .superRefine(async ({ username }, ctx) => {
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (user) {
      ctx.addIssue({
        code: "custom",
        message: "This username is already taken",
        path: ["username"],
        fatal: true,
      });
      return z.NEVER;
    }
  })
  // 검증 통과 못하면 이후 검증 실행 없이 검증 종료하는 방법
  .superRefine(async ({ email }, ctx) => {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      // ctx.addIssue를 통해 원하는 만큼 이슈 추가 가능 (ctx - context)
      // ctx.addIssue 호출 안되면 유효성 검사 통과
      ctx.addIssue({
        code: "custom",
        message: "This email is already taken",
        path: ["email"],
        // 다음 refine 실행 방지
        fatal: true,
      });
      // 타입시스템 맞추기 위함
      return z.NEVER;
    }
  })
  .refine(checkPasswords, {
    message: "Both passwords should be equal",
    path: ["confirm_password"],
  });

export async function createAccount(prevState: any, formData: FormData) {
  // validation 대상 데이터
  const data = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };
  // usernameSchema.parse(data.username);
  // validation 대상 데이터를 확인 사항에 넣고 돌리기,
  // result는 그 결과물
  // const result = formSchema.safeParse(data);
  // db접근 코드가 있기 때문에 비동기로 돌려야한다.
  // const result = await formSchema.spa(data);
  const result = await formSchema.safeParseAsync(data);
  // safeParse시키면 에러없이 그냥 결과를 리턴해준다.
  // 에러가 있으면! result.success가 false!
  // 에러가 있으면! result.error에 에러가 적힌다!
  if (!result.success) {
    return result.error.flatten();
  } else {
    const hashedPassword = await bcrypt.hash(result.data.password, 12);
    const user = await db.user.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });
    //log the user in & redirect "/home"
    // ironSession은 세션이긴한데 데이터를 DB에 저장하는 식이 아니라 암호화해서 쿠키형태로 클라이언트에 모두 전가하는 식이다.
    // 무거워 지겠지 커지면 그렇겠지 그럴 수 밖에 없겠지 그치만 서버는 가벼워지겠지 그렇겠지 서버리스에 적절하겠지.
    const session = await getSession();
    // 이제부터 넌(session받을 클라) user다!
    session.id = user.id;
    await session.save();
    redirect("/profile");
  }
}
