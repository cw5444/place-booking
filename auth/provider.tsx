// auth/provider.tsx (루트 위치)
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { SupabaseClient, Session } from "@supabase/supabase-js";
// 프로젝트의 기존 singleton 클라이언트를 그대로 사용합니다.
import { supabase } from "@/lib/supabaseClient"; 

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 가져오기
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data?.session ?? null);
      } catch (err) {
        console.error("Session fetching error:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. 인증 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, s) => {
        setSession(s);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, session, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextValue => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
};

export default SupabaseProvider;
