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
/* 2️⃣  NextAuth 설정 – 기존 로직을 그대로 유지합니다.
   프로젝트에 맞게 providers / callbacks / pages 등을 채워 주세요. */
export const auth = NextAuth({
  // -----------------------------------------------------------------
  // 예시: CredentialsProvider (기존에 사용하시던 provider 구조 그대로)
  // -----------------------------------------------------------------
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
          // 필요하면 여기서 role 등 추가 필드 추출
        };
      },
    }),
    // ← 다른 provider가 있으면 여기 추가
  ],

  // -----------------------------------------------------------------
  // 세션/ JWT 콜백 (이미 프로젝트에 있던 내용이라면 그대로 복사)
  // -----------------------------------------------------------------
  callbacks: {
    async jwt({ token, user }) {
      // 로그인 시 user 가 존재 → token 에 user 정보 복사
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
        // 예시: role 필드가 있다면 token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      // session.user 에 token 에 저장한 필드 매핑
      if (token) {
        session.user.id = (token as any).id;
        session.user.email = (token as any).email;
        // 예시: session.user.role = (token as any).role;
      }
      return session;
    },
  },

  // -----------------------------------------------------------------
  // 기타 옵션 (pages, secret, etc.) – 기존 설정 그대로 사용
  // -----------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  // pages: { signIn: "/auth/signin", error: "/auth/error" }, // 예시
});

export { auth as GET, auth as POST };
