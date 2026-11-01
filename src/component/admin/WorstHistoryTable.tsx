// src/component/admin/WorstHistoryTable.tsx
import React from 'react';
import { WorstSearchHistory } from '@/types/history';
import Badge from '../ui/badge';
// 공통 테이블 컴포넌트
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/component/ui/tables';

interface WorstHistoryTableProps {
  histories: WorstSearchHistory[];
}

export default function WorstHistoryTable({ histories }: WorstHistoryTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 헤더 타이틀 */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900">🔍 실시간 품질 저하 (환각 리스크) 역추적 로그</h3>
        <p className="text-sm text-slate-500 mt-1">
          사용자가 비추천(👎) 피드백을 보낸 워스트 질의를 역추적하여 임베딩 컨텍스트 결함을 모니터링합니다.
        </p>
      </div>

      {/* 테이블 본문 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">일시</TableHead>
            <TableHead className="w-44">유저 계정</TableHead>
            <TableHead>유저 질문 (Query)</TableHead>
            <TableHead>AI 답변 (AI Answer)</TableHead>
            <TableHead className="w-32">결함 사유</TableHead>
            <TableHead className="w-52">참조 사내 문서 (PostgreSQL Array)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {histories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                현재 축적된 품질 저하 로그가 없습니다. 시스템이 아주 견고합니다! 🎉
              </TableCell>
            </TableRow>
          ) : (
            histories.map((log) => (
              <TableRow key={log.historyId}>
                {/* 일시 */}
                <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                
                {/* 유저 계정 */}
                <TableCell className="font-medium text-slate-600 whitespace-nowrap">
                  {log.maskedUserEmail}
                </TableCell>
                
                {/* 유저 질문 */}
                <TableCell className="font-semibold text-slate-900 max-w-xs truncate" title={log.query}>
                  {log.query}
                </TableCell>
                
                {/* AI 답변 */}
                <TableCell className="text-slate-600 max-w-md break-all" title={log.aiAnswer}>
                  {log.aiAnswer}
                </TableCell>
                
                {/* 결함 사유 배지 */}
                <TableCell className="whitespace-nowrap">
                  <Badge reason={log.unresolvedReason} />
                </TableCell>
                
                {/* 참조 사내 문서 */}
                <TableCell>
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {log.referencedDocuments && log.referencedDocuments.length > 0 ? (
                      log.referencedDocuments.map((doc, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap"
                        >
                          📄 {doc}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">참조 문맥 없음 (블록 차단)</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}