'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/apiClient';
import { memberApi } from '@/api/memberApi';
import PageHeader from '@/component/ui/PageHeader';
import { GroupMember, UserGroupModel } from '@/types/member';

type Notice = { type: 'success' | 'error'; message: string } | null;

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

// 그룹(워크스페이스) 관리: 그룹 만들기, 멤버 확인, OWNER는 이메일로 멤버 추가·제거
export default function GroupsPage() {
  const [myId, setMyId] = useState<number | null>(null);
  const [groups, setGroups] = useState<UserGroupModel[]>([]);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  // members가 어느 그룹의 목록인지 기록 (선택이 바뀌었는데 아직 응답 전이면 로딩으로 판단)
  const [membersGroupId, setMembersGroupId] = useState<number | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [email, setEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const isMembersLoading = selectedGroupId !== null && membersGroupId !== selectedGroupId;
  const visibleMembers = isMembersLoading ? [] : members;
  const isOwner = visibleMembers.some((m) => m.memberId === myId && m.role === 'OWNER');

  const applyGroups = useCallback((myGroups: UserGroupModel[], selectId?: number) => {
    setGroups(myGroups);
    setSelectedGroupId((current) => {
      const keep = current !== null && myGroups.some((g) => g.id === current) ? current : null;
      return selectId ?? keep ?? myGroups[0]?.id ?? null;
    });
  }, []);

  // 그룹 생성 / 삭제 뒤 목록 다시 조회
  const reloadGroups = async (selectId?: number) => {
    try {
      applyGroups((await memberApi.getMyGroups()) ?? [], selectId);
    } catch (err) {
      setNotice({ type: 'error', message: errorMessage(err, '그룹 목록을 불러오지 못했습니다.') });
    }
  };

  useEffect(() => {
    memberApi.getMe().then((me) => setMyId(me.id)).catch(() => setMyId(null));
    memberApi.getMyGroups()
      .then((myGroups) => applyGroups(myGroups ?? []))
      .catch((err) => setNotice({ type: 'error', message: errorMessage(err, '그룹 목록을 불러오지 못했습니다.') }))
      .finally(() => setIsGroupsLoading(false));
  }, [applyGroups]);

  // 선택한 그룹의 멤버 목록 조회 (응답이 왔을 때만 상태 갱신, 그 사이 선택이 바뀌면 버림)
  useEffect(() => {
    if (selectedGroupId === null) return;
    let cancelled = false;
    memberApi.getGroupMembers(selectedGroupId)
      .then((list) => list ?? [])
      .catch((err) => {
        if (!cancelled) setNotice({ type: 'error', message: errorMessage(err, '멤버 목록을 불러오지 못했습니다.') });
        return [] as GroupMember[];
      })
      .then((list) => {
        if (cancelled) return;
        setMembers(list);
        setMembersGroupId(selectedGroupId);
      });
    return () => { cancelled = true; };
  }, [selectedGroupId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isCreating) return;
    setIsCreating(true);
    setNotice(null);
    try {
      const created = await memberApi.createGroup(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setNotice({ type: 'success', message: `"${created.groupName}" 그룹을 만들었습니다. 내가 OWNER입니다.` });
      await reloadGroups(created.id);
    } catch (err) {
      setNotice({ type: 'error', message: errorMessage(err, '그룹을 만들지 못했습니다.') });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupId === null || !selectedGroup || !email.trim() || isAdding) return;
    // 응답 전에 선택이 바뀌어도 안내 문구는 요청을 보낸 그룹 이름으로 표시
    const groupName = selectedGroup.groupName;
    setIsAdding(true);
    setNotice(null);
    try {
      const added = await memberApi.addGroupMember(selectedGroupId, email.trim());
      setMembers((prev) => [...prev, added]);
      setEmail('');
      setNotice({ type: 'success', message: `${added.email} 님을 "${groupName}" 그룹에 추가했습니다. 다음 요청부터 이 그룹 문서를 검색할 수 있습니다.` });
    } catch (err) {
      setNotice({ type: 'error', message: errorMessage(err, '멤버를 추가하지 못했습니다.') });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (selectedGroupId === null || !selectedGroup) return;
    const groupName = selectedGroup.groupName;
    if (!confirm(`${member.email} 님을 "${groupName}" 그룹에서 제거할까요? 이 그룹 문서를 더 이상 검색할 수 없게 됩니다.`)) return;
    setNotice(null);
    try {
      await memberApi.removeGroupMember(selectedGroupId, member.memberId);
      setMembers((prev) => prev.filter((m) => m.memberId !== member.memberId));
      setNotice({ type: 'success', message: `${member.email} 님을 "${groupName}" 그룹에서 제거했습니다.` });
    } catch (err) {
      setNotice({ type: 'error', message: errorMessage(err, '멤버를 제거하지 못했습니다.') });
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm(`"${selectedGroup.groupName}" 그룹을 삭제할까요? 멤버 모두가 이 그룹 문서를 검색할 수 없게 됩니다.`)) return;
    setNotice(null);
    try {
      await memberApi.deleteGroup(selectedGroup.id);
      setNotice({ type: 'success', message: `"${selectedGroup.groupName}" 그룹을 삭제했습니다.` });
      setSelectedGroupId(null);
      await reloadGroups();
    } catch (err) {
      setNotice({ type: 'error', message: errorMessage(err, '그룹을 삭제하지 못했습니다.') });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <PageHeader
        title="그룹 관리"
        description="회사 팀, 스터디, 개인 공간처럼 문서를 함께 볼 그룹을 만듭니다. 그룹에 공개한 문서는 그 그룹 멤버만 검색할 수 있습니다."
      />

      {notice && (
        <div className={`max-w-5xl mb-6 p-3.5 text-xs font-semibold rounded-xl border ${
          notice.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'
        }`}>
          {notice.message}
        </div>
      )}

      <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 내 그룹 목록 + 새 그룹 */}
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3">내 그룹</h2>
            {isGroupsLoading ? (
              <p className="text-xs text-slate-400">불러오는 중...</p>
            ) : groups.length === 0 ? (
              <p className="text-xs text-slate-400">아직 속한 그룹이 없습니다. 아래에서 새 그룹을 만들어 보세요.</p>
            ) : (
              <ul className="space-y-1.5">
                {groups.map((group) => (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl border transition ${
                        group.id === selectedGroupId
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {group.groupName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900">새 그룹 만들기</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: CS 스터디"
              maxLength={100}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!newName.trim() || isCreating}
              className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition"
            >
              {isCreating ? '만드는 중...' : '그룹 만들기'}
            </button>
          </form>
        </div>

        {/* 오른쪽: 선택한 그룹의 멤버 */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {!selectedGroup ? (
            <p className="text-xs text-slate-400">그룹을 선택하면 멤버를 볼 수 있습니다.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedGroup.groupName}</h2>
                  {selectedGroup.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedGroup.description}</p>
                  )}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition shrink-0"
                  >
                    그룹 삭제
                  </button>
                )}
              </div>

              {isOwner && (
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`"${selectedGroup.groupName}"에 추가할 회원의 이메일`}
                    className="grow min-w-0 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!email.trim() || isAdding}
                    title={`${selectedGroup.groupName}에 추가`}
                    className="max-w-[12rem] truncate px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition shrink-0"
                  >
                    {isAdding ? '추가 중...' : `${selectedGroup.groupName}에 추가`}
                  </button>
                </form>
              )}
              {!isOwner && !isMembersLoading && (
                <p className="text-xs text-slate-400">멤버 추가와 제거는 그룹 OWNER만 할 수 있습니다.</p>
              )}

              {isMembersLoading ? (
                <p className="text-xs text-slate-400">멤버를 불러오는 중...</p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                  {visibleMembers.map((member) => (
                    <li key={member.memberId} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {member.userName || member.email}
                          {member.memberId === myId && <span className="ml-1.5 text-[10px] text-slate-400">(나)</span>}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                          member.role === 'OWNER'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {member.role}
                        </span>
                        {isOwner && member.role !== 'OWNER' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member)}
                            className="px-2 py-0.5 text-[10px] font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition"
                          >
                            제거
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
