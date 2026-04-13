// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/* 1️⃣ 서버 전용 Supabase 클라이언트
   - persistSession: false로 설정하여 서버 메모리에서만 인증을 처리합니다. */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/* ------------------------------------------------------------------ */
/* 2️⃣ NextAuth 설정 - 사용자님의 원래 로직을 유지하며 타입 에러만 수정 */
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Supabase 를 이용해 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        });

        if (error || !data?.user) {
          console.error("Supabase login error:", error?.message);
          return null;
        }

        // 로그인 성공 → NextAuth 세션에 넣을 사용자 객체 반환
        // 사용자 정보(role 등)를 metadata에서 추출하여 포함시킵니다.
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || "user", 
        };
      },
    }),
  ],

  callbacks: {
    // Vercel 빌드 에러 방지를 위해 : any 타입을 명시적으로 사용합니다.
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; // role 정보 저장
      }
      return token;
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role; // 세션에 role 정보 주입
      }
      return session;
    },
  },

  // 보안 및 세션 관리 설정
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
