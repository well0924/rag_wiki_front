'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/api/apiClient';
import { documentApi } from '@/api/documentApi';
import { memberApi } from '@/api/memberApi';
import PageHeader from '@/component/ui/PageHeader';
import { DocumentModel, DocumentStatus } from '@/types/api';
import { MemberModel } from '@/types/member';

const STATUS_STYLE: Record<DocumentStatus, { label: string; css: string }> = {
  UPLOADED: { label: '대기 중', css: 'bg-slate-100 text-slate-600 border-slate-200' },
  PROCESSING: { label: '처리 중', css: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: '검색 가능', css: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: '실패 · 다시 업로드 필요', css: 'bg-red-50 text-red-700 border-red-200' },
};

const POLLING_INTERVAL_MS = 5000;

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [me, setMe] = useState<MemberModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await documentApi.getAccessibleDocuments();
      setDocuments([...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : '문서 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    memberApi.getMe().then(setMe).catch(() => setMe(null));
  }, [loadDocuments]);

  // 인덱싱이 끝나지 않은 문서가 있으면 상태가 바뀔 때까지 주기적으로 새로고침
  const hasPending = documents.some((d) => d.status === 'UPLOADED' || d.status === 'PROCESSING');
  useEffect(() => {
    if (!hasPending) return;
    const timerId = setInterval(loadDocuments, POLLING_INTERVAL_MS);
    return () => clearInterval(timerId);
  }, [hasPending, loadDocuments]);

  const canDelete = (doc: DocumentModel) => me !== null && (me.role === 'ROLE_ADMIN' || me.id === doc.createdBy);

  const handleDelete = async (doc: DocumentModel) => {
    if (!confirm(`'${doc.title}' 문서를 삭제할까요? 삭제하면 검색에서도 바로 제외됩니다.`)) return;
    try {
      await documentApi.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <PageHeader
        title="문서 목록"
        description="내가 속한 그룹에 공개된 문서만 보입니다. '검색 가능' 상태가 된 문서부터 검색 답변에 사용됩니다."
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400">총 {documents.length}건</span>
        <div className="flex gap-2">
          <button
            onClick={loadDocuments}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            새로고침
          </button>
          <Link
            href="/documents"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
          >
            문서 업로드
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">{errorMsg}</div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
          열람할 수 있는 문서가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => {
            const status = STATUS_STYLE[doc.status] ?? STATUS_STYLE.UPLOADED;
            return (
              <li key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded border ${status.css}`}>{status.label}</span>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base truncate">{doc.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {doc.docType} · {formatFileSize(doc.fileSize)} · {doc.createdAt.slice(0, 16).replace('T', ' ')}
                  </p>
                </div>
                {canDelete(doc) && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition"
                  >
                    삭제
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
