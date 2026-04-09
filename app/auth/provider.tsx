"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createClient,
  SupabaseClient,
  Session,
} from "@supabase/supabase-js";
import { SessionProvider } from "next-auth/react"; // 1. 추가

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    // 2. 외부를 SessionProvider로 감싸줍니다.
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
