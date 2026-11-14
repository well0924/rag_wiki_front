'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/api/apiClient';
import { documentApi } from '@/api/documentApi';
import { memberApi } from '@/api/memberApi';
import PageHeader from '@/component/ui/PageHeader';
import { UserGroupModel } from '@/types/member';

// 업로드 제한 (화면 안내와 사전 검증에 함께 사용)
// - 형식: 백엔드 DocumentService.ALLOWED_DOC_TYPES 와 동일
// - 파일 크기: 백엔드 spring.servlet.multipart.max-file-size(5MB)와 맞춰야 함. 서버 값을 바꾸면 여기도 함께 변경
// - 파일 개수: 한 번에 고를 수 있는 최대 개수 (화면 제한)
const ALLOWED_EXTENSIONS = ['md', 'txt', 'pdf', 'docx'];
const ACCEPTED_EXTENSIONS = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILE_COUNT = 5;
const MAX_TITLE_LENGTH = 100;
// 글자 수 상한: 백엔드 DocumentService.MAX_CONTENT_LENGTH 와 동일 (추출 후 서버에서 검사, 화면은 안내만)
const MAX_TEXT_LENGTH = 200_000;

type ItemStatus = 'ready' | 'uploading' | 'success' | 'error';

type UploadItem = {
  id: string;
  file: File;
  title: string;
  status: ItemStatus;
  message?: string;
};

type Notice = { type: 'success' | 'error' | 'warning'; message: string } | null;

const getExtension = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const STATUS_LABEL: Record<ItemStatus, { text: string; className: string }> = {
  ready: { text: '대기', className: 'text-slate-500 bg-slate-100' },
  uploading: { text: '업로드 중', className: 'text-blue-700 bg-blue-50' },
  success: { text: '완료', className: 'text-emerald-700 bg-emerald-50' },
  error: { text: '실패', className: 'text-red-600 bg-red-50' },
};

export default function DocumentUploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [groups, setGroups] = useState<UserGroupModel[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [inputKey, setInputKey] = useState(0);

  // 업로드 공개 그룹은 내가 소속된 그룹 중에서만 선택 가능 (백엔드도 동일하게 검증)
  useEffect(() => {
    memberApi.getMyGroups()
      .then((myGroups) => setGroups(myGroups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setIsGroupsLoading(false));
  }, []);

  // 파일 선택: 제한에 걸리는 파일은 목록에 넣지 않고 사유를 안내
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setInputKey((k) => k + 1); // 같은 파일을 다시 고를 수 있도록 input 초기화
    if (selected.length === 0) return;

    // 이전에 업로드가 끝난 항목은 정리하고 새로 시작
    const current = items.filter((item) => item.status !== 'success');
    const existingKeys = new Set(current.map((item) => fileKey(item.file)));
    const rejected: string[] = [];
    const accepted: UploadItem[] = [];

    for (const file of selected) {
      if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
        rejected.push(`${file.name}: 지원하지 않는 형식`);
      } else if (file.size === 0) {
        rejected.push(`${file.name}: 빈 파일`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: ${MAX_FILE_SIZE_MB}MB 초과 (${formatSize(file.size)})`);
      } else if (existingKeys.has(fileKey(file))) {
        rejected.push(`${file.name}: 이미 목록에 있음`);
      } else if (current.length + accepted.length >= MAX_FILE_COUNT) {
        rejected.push(`${file.name}: 한 번에 최대 ${MAX_FILE_COUNT}개`);
      } else {
        existingKeys.add(fileKey(file));
        accepted.push({
          id: `${fileKey(file)}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          title: file.name.replace(/\.[^/.]+$/, '').slice(0, MAX_TITLE_LENGTH),
          status: 'ready',
        });
      }
    }

    setItems([...current, ...accepted]);
    setNotice(rejected.length > 0
      ? { type: 'warning', message: `다음 파일은 제외했습니다. ${rejected.join(' / ')}` }
      : null);
  };

  const handleTitleChange = (id: string, title: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const pendingItems = items.filter((item) => item.status === 'ready' || item.status === 'error');
  const hasBlankTitle = pendingItems.some((item) => !item.title.trim());
  const canSubmit = pendingItems.length > 0 && !hasBlankTitle && selectedGroups.length > 0 && !isSubmitting;

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  // 파일마다 제목이 다르므로 파일 1개당 요청 1번, 순서대로 전송
  // - 하나가 실패해도 나머지는 계속 진행하고, 실패한 파일만 다시 시도할 수 있음
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setNotice(null);
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      updateItem(item.id, { status: 'uploading', message: undefined });

      const formData = new FormData();
      formData.append('title', item.title.trim());
      selectedGroups.forEach((groupId) => formData.append('targetGroupIds', String(groupId)));
      formData.append('file', item.file);

      try {
        await documentApi.uploadDocument(formData);
        updateItem(item.id, { status: 'success' });
        successCount++;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : '업로드에 실패했습니다.';
        updateItem(item.id, { status: 'error', message });
        failCount++;
      }
    }

    setIsSubmitting(false);
    if (failCount === 0) {
      setNotice({ type: 'success', message: `${successCount}개를 업로드했습니다. 검색에 반영되기까지 잠시 걸릴 수 있어요.` });
      setSelectedGroups([]);
    } else {
      setNotice({ type: 'error', message: `${successCount}개 성공, ${failCount}개 실패했습니다. 실패한 파일은 사유를 확인한 뒤 다시 업로드할 수 있습니다.` });
    }
  };

  const noticeStyle = {
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <PageHeader
        title="문서 업로드"
        description="문서를 올리고 열람할 그룹을 지정하세요. 지정한 그룹의 멤버만 이 문서를 검색할 수 있습니다."
      />

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="font-semibold text-slate-700 mb-2">업로드 제한</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>형식: {ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(', ')}</li>
            <li>파일 크기: 파일당 최대 {MAX_FILE_SIZE_MB}MB</li>
            <li>개수: 한 번에 최대 {MAX_FILE_COUNT}개 (파일마다 따로 저장되며, 일부가 실패해도 나머지는 올라갑니다)</li>
            <li>글자 수: 파일당 최대 {MAX_TEXT_LENGTH.toLocaleString()}자. 넘으면 문서를 나눠서 올려 주세요.</li>
            <li>글자가 없는 파일(이미지로 된 스캔 PDF, 빈 파일)은 검색할 수 없어 올릴 수 없습니다.</li>
            <li>문서 안의 이미지는 검색에 반영되지 않고, 글자만 반영됩니다.</li>
            <li>올린 뒤 검색에 반영되기까지 잠시 걸립니다. 진행 상태는 문서 목록에서 볼 수 있습니다.</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            파일 <span className="font-normal text-slate-400">({items.filter((i) => i.status !== 'success').length}/{MAX_FILE_COUNT})</span>
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 bg-slate-50/50 flex flex-col items-center justify-center transition relative">
            <input
              key={inputKey}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            <div className="text-center space-y-2">
              <span className="text-3xl">📤</span>
              <p className="text-sm font-medium text-slate-600">클릭하거나 파일을 끌어다 놓으세요. 여러 개를 한 번에 고를 수 있습니다.</p>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">파일별 제목</label>
            <p className="text-xs text-slate-400 mb-3">파일 이름이 제목으로 들어갑니다. 필요하면 고쳐 주세요.</p>
            <ul className="space-y-2">
              {items.map((item) => {
                const status = STATUS_LABEL[item.status];
                const locked = item.status === 'uploading' || item.status === 'success' || isSubmitting;
                return (
                  <li key={item.id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${status.className}`}>{status.text}</span>
                      <span className="truncate flex-1" title={item.file.name}>{item.file.name}</span>
                      <span className="shrink-0">{formatSize(item.file.size)}</span>
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="shrink-0 text-slate-400 hover:text-red-500"
                          aria-label={`${item.file.name} 빼기`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleTitleChange(item.id, e.target.value)}
                      maxLength={MAX_TITLE_LENGTH}
                      disabled={locked}
                      placeholder="예: 서비스 배포 절차 가이드"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:text-slate-400"
                    />
                    {item.status === 'error' && item.message && (
                      <p className="mt-2 text-xs text-red-600">{item.message}</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {hasBlankTitle && <p className="mt-2 text-xs text-red-600">제목이 비어 있는 파일이 있습니다.</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">열람 가능 그룹</label>
          <p className="text-xs text-slate-400 mb-3">내가 속한 그룹 중에서 선택할 수 있습니다. 고른 그룹은 이번에 올리는 모든 파일에 적용됩니다.</p>
          {isGroupsLoading ? (
            <p className="text-xs text-slate-400">그룹 목록을 불러오는 중...</p>
          ) : groups.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              속한 그룹이 없어 문서를 올릴 수 없습니다. <Link href="/groups" className="underline">그룹 관리</Link>에서 그룹을 만들거나, 그룹 OWNER에게 추가를 요청해 주세요.
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
                    disabled={isSubmitting}
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

        {notice && (
          <div className={`p-3.5 text-xs font-semibold rounded-xl border ${noticeStyle[notice.type]}`}>
            {notice.message}
            {notice.type !== 'warning' && items.some((item) => item.status === 'success') && (
              <Link href="/documents/list" className="ml-2 underline">문서 목록 보기</Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
        >
          {isSubmitting
            ? '업로드 중...'
            : pendingItems.length > 0
              ? `${pendingItems.length}개 업로드`
              : '업로드'}
        </button>
      </form>
    </div>
  );
}
