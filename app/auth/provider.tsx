"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  SupabaseClient,
  Session,
} from "@supabase/supabase-js";
import { SessionProvider } from "next-auth/react";
// 1. 싱글톤 클라이언트를 가져옵니다.
import { supabase } from "@/lib/supabaseClient"; 

// 2. 기존의 중복된 createClient 호출 코드는 삭제했습니다.

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3. 이제 싱글톤 인스턴스(supabase)를 사용하여 세션을 관리합니다.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

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
    <SessionProvider>
      <SupabaseContext.Provider value={{ supabase, session, loading }}>
        {children}
      </SupabaseContext.Provider>
    </SessionProvider>
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
