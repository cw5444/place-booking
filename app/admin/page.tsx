// app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSupabase } from '../auth/provider';

const ADMIN_EMAILS = ['cw5444@gmail.com', '24umut@gmail.com'];

export default function AdminPage() {
  const { supabase, session } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = session?.user;

  useEffect(() => {
    if (user?.email) {
      setIsAdmin(ADMIN_EMAILS.includes(user.email));
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  if (loading) return <div className="p-8 text-center">권한 확인 중...</div>;

  if (!user) {
    return (
      <div className="p-8 max-w-sm mx-auto flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4">관리자 로그인</h2>
        <button
          onClick={async () => {
            const email = window.prompt("관리자 이메일을 입력하세요:");
            if (email) {
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo: `${window.location.origin}/admin`,
                },
              });
              if (error) alert("에러: " + error.message);
              else alert("전송 완료! 메일함(스팸함 포함)의 링크를 클릭해 주세요.");
            }
          }}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold"
        >
          이메일로 로그인하기
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">접근 권한이 없습니다.</h2>
        <p className="mt-2 text-gray-500">{user.email} 계정은 관리자가 아닙니다.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm underline">로그아웃</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">🛠️ 관리자 대시보드</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">{user.email} (관리자)</span>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-400 hover:text-black underline">로그아웃</button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 text-center">
        <p className="text-gray-400 text-lg">로그인이 성공했습니다! 🎉</p>
        <p className="mt-2 text-sm text-gray-400 italic">여기에 곧 예약 승인/차단 기능을 추가할게요.</p>
      </div>
    </div>
  );
}
