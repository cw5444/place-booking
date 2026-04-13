"use client";

import { useState } from "react";
import { useSupabase } from "../../auth/provider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("🔔 로그인 시도 시작:", { email });

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data?.session) {
        console.log("✅ 로그인 성공! 세션 확인됨:", data.session);
        
        // 중요: 관리자 권한 확인
        const role = data.session.user.app_metadata?.role || data.session.user.user_metadata?.role;
        console.log("👤 유저 역할(Role):", role);

        if (role !== 'admin') {
          setError("관리자 권한이 없는 계정입니다. (현재 Role: " + (role || "없음") + ")");
          await supabase.auth.signOut();
          return;
        }

        // 로그가 사라지기 전에 멈춰서 확인하기 위한 알림창
        alert("로그인 성공! 확인을 누르면 /admin으로 이동합니다. (Role: " + role + ")");

        // 💡 핵심: router.replace 대신 window.location.href 사용
        console.log("🚀 /admin으로 강제 이동합니다...");
        window.location.href = "/admin"; 
        
      } else {
        setError("세션을 생성할 수 없습니다.");
      }
    } catch (err: any) {
      console.error("❌ 로그인 에러:", err);
      setError(err?.message ?? "로그인 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: 400,
        margin: "0 auto",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#f9f9f9",
      }}
    >
      <h1 style={{ marginBottom: "1.5rem", textAlign: "center", color: "black" }}>
        관리자 로그인
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          border: "1px solid #eee",
          padding: "2rem",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "black" }}>이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="admin@example.com"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "black" }}>비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ color: "red", fontSize: 13, marginBottom: "1rem" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  marginTop: "0.25rem",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "16px",
  color: "black",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  backgroundColor: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "1rem",
};
