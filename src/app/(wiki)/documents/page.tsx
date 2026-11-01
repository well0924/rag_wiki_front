'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/api/apiClient';
import { documentApi } from '@/api/documentApi';
import { memberApi } from '@/api/memberApi';
import PageHeader from '@/component/ui/PageHeader';
import { UserGroupModel } from '@/types/member';

const ACCEPTED_EXTENSIONS = '.md,.txt,.pdf,.docx';

type UploadResult = { type: 'success' | 'error'; message: string } | null;

export default function DocumentUploadPage() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<UserGroupModel[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult>(null);

  // 업로드 권한 부서는 내가 소속된 그룹 중에서만 선택 가능 (백엔드도 동일하게 검증)
  useEffect(() => {
    memberApi.getMyGroups()
      .then((myGroups) => setGroups(myGroups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setIsGroupsLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const canSubmit = !!title.trim() && !!file && selectedGroups.length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    selectedGroups.forEach((groupId) => formData.append('targetGroupIds', String(groupId)));
    formData.append('file', file);

    setIsSubmitting(true);
    setResult(null);
    try {
      await documentApi.uploadDocument(formData);
      setResult({ type: 'success', message: '업로드했습니다. 검색에 반영되기까지 잠시 걸릴 수 있어요. 진행 상태는 문서 목록에서 확인할 수 있습니다.' });
      setTitle('');
      setFile(null);
      setSelectedGroups([]);
    } catch (err) {
      setResult({ type: 'error', message: err instanceof ApiError ? err.message : '업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <PageHeader
        title="문서 업로드"
        description="문서를 올리고 열람할 부서를 지정하세요. 지정한 부서의 사용자만 이 문서를 검색할 수 있습니다."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">파일</label>
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center transition relative">
            <input
              key={file ? file.name : 'empty'}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="text-center space-y-2">
              <span className="text-3xl">📤</span>
              <p className="text-sm font-medium text-slate-600">
                {file ? <span className="text-blue-600 font-bold">{file.name}</span> : '클릭하거나 파일을 끌어다 놓으세요.'}
              </p>
              <p className="text-xs text-slate-400">지원 형식: .md, .txt, .pdf, .docx (이미지로 된 스캔 PDF는 지원하지 않습니다)</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 서비스 배포 절차 가이드"
            required
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">열람 가능 부서</label>
          <p className="text-xs text-slate-400 mb-3">내가 소속된 부서 중에서 선택할 수 있습니다.</p>
          {isGroupsLoading ? (
            <p className="text-xs text-slate-400">부서 목록을 불러오는 중...</p>
          ) : groups.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              소속된 부서가 없어 문서를 올릴 수 없습니다. 관리자에게 부서 배정을 요청해 주세요.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {groups.map((group) => {
                const isChecked = selectedGroups.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupToggle(group.id)}
                    className={`p-3 text-xs font-semibold rounded-xl border transition text-center ${
                      isChecked
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {group.groupName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {result && (
          <div className={`p-3.5 text-xs font-semibold rounded-xl border ${
            result.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'
          }`}>
            {result.message}
            {result.type === 'success' && (
              <Link href="/documents/list" className="ml-2 underline">문서 목록 보기</Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
        >
          {isSubmitting ? '업로드 중...' : '업로드'}
        </button>
      </form>
    </div>
  );
}
