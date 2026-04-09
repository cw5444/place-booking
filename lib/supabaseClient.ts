// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 중복 생성 방지를 위한 변수
let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // NextAuth를 쓰므로 Supabase 자체 저장은 끕니다.
        autoRefreshToken: false, // NextAuth가 토큰을 관리하므로 끕니다.
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseInstance;
};

// 기존 코드와의 호환성을 위해 export
export const supabase = getSupabase();
