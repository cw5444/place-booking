"use client";

import { useState, useEffect } from "react";
import { signIn, useSession, signOut } from "next-auth/react"; // signOut 추가
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ [수정] 성급한 리다이렉트 방지 + 디버깅 로그
  useEffect(() => {
    console.log("현재 세션 상태:", status);
    console.log("세션 데이터 유무:", !!session);

    if (status === "authenticated" && session) {
      // 진짜 로그인이 된 게 확실할 때만 이동
      router.replace("/admin/bookings");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div style={{ padding: "2rem", textAlign: "center" }}>로그인 정보를 확인하고 있습니다...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.replace("/admin/bookings");
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 400, margin: "0 auto" }}>
      <h1>관리자 로그인</h1>

      {/* 🛑 만약 튕김 현상이 계속되면 '강제 로그아웃' 버튼으로 초기화할 수 있게 추가 */}
      {status === "authenticated" && (
        <p style={{ color: "orange", marginBottom: "1rem" }}>
          세션 오류가 의심됩니다. 
          <button onClick={() => signOut()} style={{ marginLeft: "10px" }}>로그아웃 세션 초기화</button>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #ccc" }}
          />
        </div>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <button type="submit" style={{ width: "100%", padding: "10px", background: "#000", color: "#fff" }}>
          로그인
        </button>
      </form>
    </main>
  );
}
