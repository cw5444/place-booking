// app/supabase-provider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      setSession(_session);
      if (event === "SIGNED_IN") router.refresh();
      if (event === "SIGNED_OUT") router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};
