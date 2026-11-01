// src/component/admin/MetricCardsRow.tsx
import React from 'react';
import { SearchQualityMetrics } from '@/types/history';

interface MetricCardsRowProps {
  metrics: SearchQualityMetrics;
}

export default function MetricCardsRow({ metrics }: MetricCardsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 카드 1: 총 질의수 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500">전체 AI 검색 횟수</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">
          {metrics.totalQueryCount.toLocaleString()} <span className="text-lg font-normal text-slate-400">건</span>
        </p>
      </div>

      {/* 카드 2: 긍정 피드백 비율 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500">시스템 답변 만족도 (👍)</p>
        <p className="text-3xl font-bold text-emerald-600 mt-2">
          {metrics.positiveFeedbackRate}%
        </p>
      </div>

      {/* 카드 3: 부정 피드백 비율 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm font-medium text-slate-500">품질 결함/불만족 율 (👎 🔥)</p>
        <p className="text-3xl font-bold text-rose-600 mt-2">
          {metrics.negativeFeedbackRate}%
        </p>
      </div>
    </div>
  );
}