// src/component/ui/tables.tsx
import React from 'react';

// 1. 테이블 Wrapper (가로 스크롤, 테두리)
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left border-collapse text-sm text-slate-700">
        {children}
      </table>
    </div>
  );
}

// 2. 테이블 헤더 (thead)
export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50/70 border-b border-slate-200">{children}</thead>;
}

// 3. 테이블 본문 (tbody)
export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>;
}

// 4. 테이블 Row (Tr)
export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-slate-50/50 transition-colors ${className}`}>{children}</tr>;
}

// 5. 헤더 셀 (Th)
export function TableHead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

// 6. 바디 셀 (Td)
export function TableCell({ 
  children, 
  className = "", 
  colSpan,
  title
}: { 
  children: React.ReactNode; 
  className?: string; 
  colSpan?: number; 
  title?: string;
}) {
  return (
    <td 
      colSpan={colSpan} 
      title={title}
      className={`py-4 px-6 align-middle ${className}`}
    >
      {children}
    </td>
  );
}