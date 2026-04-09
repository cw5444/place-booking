import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// Supabase 관리자 권한 클라이언트 설정 (서버 사이드용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "이메일", type: "text" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Supabase Auth로 로그인 시도
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          console.error("로그인 실패:", error?.message);
          return null;
        }

        // 2. 로그인 성공한 유저 정보 반환 (여기에 우리가 SQL로 넣은 role이 포함됨)
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.app_metadata?.role, // SQL로 넣은 그 role입니다!
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 처음 로그인 시 user 객체에서 role을 꺼내 토큰에 저장합니다.
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에서도 role을 사용할 수 있도록 전달합니다.
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
