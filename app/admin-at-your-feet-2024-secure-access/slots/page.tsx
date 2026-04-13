// app/admin/slots/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSupabase } from '../../auth/provider';

// 1. 타입 정의 수정 (ID는 UUID 문자열, 컬럼명은 SQL과 일치하게)
type Place = {
  id: string;
  name: string;
};

type Slot = {
  id: string;
  place_id: string;
  start_at: string; // SQL 컬럼명 필히 일치
  end_at: string;   // SQL 컬럼명 필히 일치
  status: string;   // PENDING | BLOCKED | OPEN
  places?: { name: string }; // Join 데이터
};

export default function SlotsPage() {
  const { supabase } = useSupabase();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [places, setPlaces] = useState<Place[]>([]); // 장소 목록
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({
    place_id: '',
    start_at: '',
    end_at: '',
  });

  // ---------- 데이터 로드 (장소 + 슬롯) ----------
  const fetchData = async () => {
    setLoading(true);
    
    // 1. 장소들 가져오기 (드롭다운 용)
    const { data: placesData } = await supabase.from('places').select('id, name');
    if (placesData) setPlaces(placesData);

    // 2. 슬롯들 가져오기 (Join 포함)
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*, places(name)')
      .order('start_at', { ascending: true }); // 정렬 기준도 start_at으로 변경

    if (slotsError) {
      console.error('fetchSlots 상세 에러:', slotsError);
    } else {
      setSlots(slotsData as Slot[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- 차단 슬롯 생성 ----------
  const handleBlock = async () => {
    const { place_id, start_at, end_at } = newSlot;
    if (!place_id || !start_at || !end_at) {
      alert('장소와 시간을 모두 선택하세요.');
      return;
    }

    const { error } = await supabase.from('slots').insert({
      place_id, // UUID 문자열 그대로 전달
      start_at,
      end_at,
      status: 'BLOCKED',
    });

    if (error) {
      alert('생성 실패: ' + (error.message || '시간이 중복되거나 잘못되었습니다.'));
      console.error(error);
    } else {
      alert('해당 시간이 차단(BLOCKED) 처리되었습니다.');
      setNewSlot({ place_id: '', start_at: '', end_at: '' });
      fetchData(); // 새로 고침
    }
  };

  // ---------- 슬롯 삭제 ----------
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠어요?')) return;
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else fetchData();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">데이터 로드 중…</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📅 슬롯 관리/차단 (Admin)</h1>

      {/* ---- 새 차단 슬롯 입력 폼 (Place ID 숫자 입력 대신 드롭다운) ---- */}
      <section className="mb-10 p-6 bg-red-50 rounded-xl border border-red-100 shadow-sm">
        <h2 className="font-semibold mb-4 text-red-800">특정 시간대 차단하기 (점검/내부행사)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border rounded-lg p-2 bg-white"
            value={newSlot.place_id}
            onChange={e => setNewSlot({ ...newSlot, place_id: e.target.value })}
          >
            <option value="">장소 선택</option>
            {places.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">시작 시간</span>
            <input
              type="datetime-local"
              className="border rounded-lg p-2"
              value={newSlot.start_at}
              onChange={e => setNewSlot({ ...newSlot, start_at: e.target.value })}
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">종료 시간</span>
            <input
              type="datetime-local"
              className="border rounded-lg p-2"
              value={newSlot.end_at}
              onChange={e => setNewSlot({ ...newSlot, end_at: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={handleBlock}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
        >
          차단 슬롯 추가
        </button>
      </section>

      {/* ---- 기존 슬롯 리스트 ---- */}
      <section>
        <h2 className="font-semibold mb-4 text-gray-700">현재 생성된 모든 슬롯</h2>
        {slots.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-400">등록된 슬롯이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="p-3 text-left">장소</th>
                  <th className="p-3 text-left">시작 일시</th>
                  <th className="p-3 text-left">종료 일시</th>
                  <th className="p-3 text-center">상태</th>
                  <th className="p-3 text-center">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slots.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{s.places?.name || '알 수 없음'}</td>
                    <td className="p-3 text-gray-600">{new Date(s.start_at).toLocaleString()}</td>
                    <td className="p-3 text-gray-600">{new Date(s.end_at).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        s.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-semibold"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
