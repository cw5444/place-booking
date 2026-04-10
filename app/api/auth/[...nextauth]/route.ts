// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/* 1️⃣  서버 전용 Supabase 클라이언트 – 세션 저장을 끈 상태
   (브라우저에 토큰이 남지 않으면서 NextAuth가 토큰을 관리합니다) */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,      // ← 핵심 : 브라우저 스토리지에 토큰을 남기지 않음
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

/* ------------------------------------------------------------------ */
/* 2️⃣  NextAuth 설정 – 기존 로직을 그대로 유지합니다. */
export const auth = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Supabase 를 이용해 로그인 시도
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        });

        if (error || !data?.user) {
          console.error("Supabase login error:", error);
          return null;
        }

        // 로그인 성공 → NextAuth 세션에 넣을 사용자 객체 반환
        return {
          id: data.user.id,
          email: data.user.email,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
      }
      return token;
    },

    // 75행 에러 해결: 파라미터에 : any 추가 및 user 객체 존재 확인
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = (token as any).id;
        session.user.email = (token as any).email;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { auth as GET, auth as POST };
