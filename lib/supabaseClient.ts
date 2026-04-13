// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

//--- 싱글톤 인스턴스 -------------------------------------------------
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,          // NextAuth가 토큰을 관리합니다
        autoRefreshToken: false,
        detectSessionInUrl: false,
        // 같은 키를 두 번 만들면 경고가 뜨니 한 번만 사용하도록 고정
        storageKey: 'supabase-auth-token',
      },
    });
  }
  return supabaseInstance;
};

// 클라이언트 컴포넌트에서 바로 사용하고 싶다면 아래 export 를 그대로 쓰세요
export const supabase = getSupabase();
