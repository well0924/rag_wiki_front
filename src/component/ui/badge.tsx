// src/component/ui/badge.tsx
import React from 'react';

// 품질 저하 사유(unresolvedReason)별 배지
type BadgeReasonType = 'HALLUCINATION' | 'PERMISSION_DENIED' | 'MISSING_INFO';

interface BadgeProps {
  reason: BadgeReasonType;
}

export default function Badge({ reason }: BadgeProps) {
  // 사유별 라벨 / 색상
  const styleMap: Record<BadgeReasonType, { text: string; css: string }> = {
    HALLUCINATION: {
      text: '환각 현상',
      css: 'bg-amber-50 text-amber-700 border-amber-200', // 주황색 계열 (품질 경고)
    },
    PERMISSION_DENIED: {
      text: '권한 거부',
      css: 'bg-rose-50 text-rose-700 border-rose-200',     // 빨간색 계열 (보안 필터 차단)
    },
    MISSING_INFO: {
      text: '정보 누락',
      css: 'bg-slate-100 text-slate-700 border-slate-300', // 회색 계열 (데이터 부재)
    },
  };

  const currentStyle = styleMap[reason] || { text: reason, css: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${currentStyle.css}`}>
      {currentStyle.text}
    </span>
  );
}