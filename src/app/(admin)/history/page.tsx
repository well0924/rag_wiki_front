'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { historyApi } from '@/api/historyApi';
import { SearchHistoryModel, SearchQualityStats } from '@/types/history';

// 비율이 null(피드백 0건)이면 숫자를 지어내지 않고 "-"로 표시
const formatRate = (rate: number | null) => (rate === null ? '-' : `${rate}%`);

export default function AdminHistoryPage() {
  const [histories, setHistories] = useState<SearchHistoryModel[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [stats, setStats] = useState<SearchQualityStats | null>(null);
  const [statsError, setStatsError] = useState<boolean>(false);

  // 품질 지표는 페이지 진입 시 한 번 조회
  useEffect(() => {
    historyApi.getQualityStats()
      .then(setStats)
      .catch((err) => {
        console.error('검색 품질 지표 조회 실패:', err);
        setStatsError(true);
      });
  }, []);

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
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('👎 검색 기록 조회 실패:', err);
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
          <p className="text-[11px] text-slate-500 mt-1">관리자 전용</p>
        </div>

        <nav className="grow p-4 space-y-1">
          <Link
            href="/history"
            className="flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition bg-blue-600 text-white shadow-sm"
          >
            📊 검색 품질 모니터링
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl transition">
            ↩️ 홈으로
          </Link>
        </div>
      </aside>

      {/* 우측 메인 콘텐츠 레이아웃 */}
      <main className="grow p-6 md:p-8 space-y-8 overflow-y-auto w-full max-w-400 mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">검색 품질 모니터링</h1>
            <p className="text-xs text-slate-500 mt-1">
              사용자가 남긴 👍 / 👎 피드백으로 답변 품질을 확인합니다. 비율은 피드백을 남긴 검색만 기준으로 계산합니다.
            </p>
          </div>
        </div>

        {/* 품질 지표 */}
        {statsError ? (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            품질 지표를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider">전체 검색 수</span>
              <div className="text-2xl font-black text-slate-900">
                {stats ? stats.totalSearches.toLocaleString() : '…'} <span className="text-xs font-normal text-slate-500">건</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {stats ? `피드백 ${stats.feedbackCount.toLocaleString()}건` : '불러오는 중'}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider">만족 (👍)</span>
              <div className="text-2xl font-black text-emerald-600">{stats ? formatRate(stats.positiveRate) : '…'}</div>
              <p className="text-[11px] text-slate-400">
                {stats ? (stats.feedbackCount === 0 ? '아직 피드백이 없습니다' : `${stats.positiveCount.toLocaleString()}건`) : '불러오는 중'}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 tracking-wider">불만족 (👎)</span>
              <div className="text-2xl font-black text-red-500">{stats ? formatRate(stats.negativeRate) : '…'}</div>
              <p className="text-[11px] text-slate-400">
                {stats ? (stats.feedbackCount === 0 ? '아직 피드백이 없습니다' : `${stats.negativeCount.toLocaleString()}건`) : '불러오는 중'}
              </p>
            </div>
          </section>
        )}

        {/* Worst 로그 테이블 */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-extrabold text-slate-900">
              👎 피드백을 받은 답변
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">질문, 답변, 답변에 참조한 청크 ID를 보고 부족한 문서나 검색 설정을 찾습니다.</p>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse">
              불러오는 중...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4 w-36">일시</th>
                      <th className="p-4 w-28">기록 ID</th>
                      <th className="p-4 w-56">질문</th>
                      <th className="p-4">답변</th>
                      <th className="p-4 w-28 text-center">피드백</th>
                      <th className="p-4 w-64">참조 청크 ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {histories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                          👎 피드백을 받은 답변이 없습니다.
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
                            {log.answer || <span className="text-slate-400 italic">답변 없음</span>}
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
                                  <span className="text-slate-400 text-[10px] italic">참조 청크 없음</span>
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