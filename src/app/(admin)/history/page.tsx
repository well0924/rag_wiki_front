'line spacing: 1.25';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { historyApi } from '@/api/historyApi';
import { SearchHistoryModel } from '@/types/history';

export default function AdminHistoryPage() {
  const pathname = usePathname();

  const [histories, setHistories] = useState<SearchHistoryModel[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  
  // 첫 진입은 로딩 상태로 시작 (effect 안에서 동기적으로 setState 하지 않기 위함)
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 페이지 이동 시 로딩 표시 (effect 안의 동기 setState 를 피하려고 다음 틱에 반영)
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
    }, 0);

    historyApi.getWorstHistories(page, 10)
      .then((res) => {
        setHistories(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("어드민 Worst 로그 덤프 실패:", err);
        setIsLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">

      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-slate-900 text-slate-400 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white">
            <span className="text-xl">👑</span>
            <h2 className="text-sm font-extrabold tracking-tight">WIKI ADMIN HUB</h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">시스템 총괄 관리자 모드</p>
        </div>

        <nav className="grow p-4 space-y-1">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition ${
              pathname === '/admin/dashboard' || pathname === '/admin/history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            📊 AI 시스템 관제 콘솔
          </Link>
          <div className="px-4 py-3 text-xs font-bold rounded-xl hover:bg-slate-800/60 hover:text-slate-200 transition opacity-50 cursor-not-allowed">
            📄 전체 위키 문서 관리 (준비중)
          </div>
          <div className="px-4 py-3 text-xs font-bold rounded-xl hover:bg-slate-800/60 hover:text-slate-200 transition opacity-50 cursor-not-allowed">
            👥 유저 그룹 및 권한 통제 (준비중)
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl transition">
            ↩️ 메인 대시보드로 복귀
          </Link>
        </div>
      </aside>

      {/* 우측 메인 콘텐츠 레이아웃 */}
      <main className="grow p-6 md:p-8 space-y-8 overflow-y-auto w-full max-w-400 mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">사내 위키 AI 시스템 관제 콘솔</h1>
            <p className="text-xs text-slate-500 mt-1">
              JPA 연동 상태 검증 완료. 데이터 유실 없이 RAG 검색 품질 지표 및 Worst 피드백 로그를 실시간 정밀 역추적합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Live Stream Connected
            </span>
          </div>
        </div>

        {/* 상단 매트릭 보드 */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">누적 품질 결함 감지 수</span>
            <div className="text-2xl font-black text-slate-900">{totalElements.toLocaleString()} <span className="text-xs font-normal text-slate-500">건</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1 opacity-60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">통합 만족도 (👍)</span>
            <div className="text-2xl font-black text-emerald-600">91.4%</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1 opacity-60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">환각 리스크 임계치 (👎)</span>
            <div className="text-2xl font-black text-red-500">8.6%</div>
          </div>
        </section>

        {/* Worst 로그 테이블 */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-extrabold text-slate-900">
              🚨 실시간 품질 저하 (Worst 피드백) 역추적 로그
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">사용자가 비추천(feedback = false) 평가를 내린 데이터 스트림을 PostgreSQL text[] 소스 기반으로 역추적합니다.</p>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">
              하이버네이트 영속성 컨텍스트 데이터 스트림 동기화 중...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4 w-36">일시</th>
                      <th className="p-4 w-28">기록 식별 ID</th>
                      <th className="p-4 w-56">유저 질문 (QUERY)</th>
                      <th className="p-4">AI 답변 (ANSWER)</th>
                      <th className="p-4 w-28 text-center">피드백 상태</th>
                      <th className="p-4 w-64">참조 벡터 청크 ID (text[])</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {histories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                          현재 수집된 품질 저하 로그가 깨끗합니다.
                        </td>
                      </tr>
                    ) : (
                      histories.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 text-slate-400 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString('ko-KR', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 text-slate-500 font-mono">HISTORY_{log.id}</td>
                          <td className="p-4 text-slate-900 font-bold max-w-50 truncate" title={log.query}>
                            {log.query}
                          </td>
                          <td className="p-4 text-slate-600 leading-relaxed max-w-sm truncate" title={log.answer || ''}>
                            {log.answer || <span className="text-slate-400 italic">답변 없음 (추적 차단)</span>}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold border bg-red-50 text-red-700 border-red-200">
                              👎 비추천
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-60">
                              {log.referencedChunkIds?.map((chunk, idx) => (
                                <span key={idx} className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 text-[10px] truncate max-w-full font-mono" title={chunk}>
                                  🧩 {chunk.substring(0, 15)}...
                                </span>
                              ))}
                              {(!log.referencedChunkIds || log.referencedChunkIds.length === 0) && (
                                  <span className="text-slate-400 text-[10px] italic">참조 문맥 공백</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 컨트롤 바 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-xs border rounded-lg bg-white disabled:opacity-40 transition font-bold"
                  >
                    이전
                  </button>
                  <span className="text-xs text-slate-500 font-medium">
                    {page + 1} / {totalPages} 페이지
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-xs border rounded-lg bg-white disabled:opacity-40 transition font-bold"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}