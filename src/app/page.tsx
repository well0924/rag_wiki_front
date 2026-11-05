'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { memberApi } from '@/api/memberApi';
import { MemberModel } from '@/types/member';

function MainDashboard() {
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [user, setUser] = useState<MemberModel | null>(null);

    // 1. 토큰이 없으면 로그인 화면으로 이동
    useEffect(() => {
        setIsMounted(true);
        const savedToken = localStorage.getItem('accessToken');

        if (savedToken) {
            setIsAuthenticated(true);
        } else {
            const timeoutId = setTimeout(() => {
                router.push('/login');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [router]);

    // 2. 내 정보 조회
    useEffect(() => {
        if (!isAuthenticated) return;
        if (user) return;

        memberApi.getMe()
            .then((profile) => {
                setUser(profile);
            })
            .catch((err) => {
                console.error("프로필 동기화 예외 발생:", err);
            });
    }, [isAuthenticated, user]);

    // 로그아웃
    const handleLogout = async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;
        try {
            await memberApi.logout();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            // 서버 로그아웃 실패와 관계없이 로그인 화면으로 이동
        } finally {
            router.push('/login');
        }
    };

    // 로그인 확인 중에는 스피너만 표시
    if (!isMounted || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p className="text-xs font-semibold text-slate-400 animate-pulse">로그인 정보를 확인하는 중...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">

            {/* 글로벌 탑 바 */}
            <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🏢</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">RAG 위키 검색</h1>
                            {user && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                    {user.userName || user.username} 님 로그인 중
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">그룹 권한 기반 문서 검색 어시스턴트</p>
                    </div>
                </div>

                {/* 오른쪽 퀵 메뉴 바 */}
                <div className="flex items-center gap-4">
                    {(user?.role == 'ROLE_ADMIN') && (
                        <Link
                            href="/history"
                            className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition shadow-sm"
                        >
                            관리자 · 검색 품질
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl transition shadow-sm"
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            {/* 메인 뷰포트 영역 */}
            <main className="grow w-full px-6 py-8 max-w-400 mx-auto space-y-8">

                {/* 웰컴 배너 */}
                <div className="bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-md">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                        {user ? `${user.userName || user.username}님, ` : ''}무엇을 찾고 계신가요?
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        문서를 질문으로 검색하세요. 내가 속한 그룹에 공개된 문서만 답변에 사용되고, 다른 그룹의 문서는 검색되지 않습니다.
                    </p>
                </div>

                {/* 메뉴 */}
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <Link href="/chat" className="p-8 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl transition shadow-sm hover:shadow-md group space-y-3 text-left block">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                            💬
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">위키 검색</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                궁금한 내용을 질문하면 내 그룹의 문서를 찾아 답변합니다.
                            </p>
                        </div>
                    </Link>

                    <Link href="/documents" className="p-8 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl transition shadow-sm hover:shadow-md group space-y-3 text-left block">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                            📤
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">문서 업로드</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                문서를 올리고 열람할 그룹을 지정합니다. 업로드한 문서는 잠시 후 검색에 반영됩니다.
                            </p>
                        </div>
                    </Link>

                    <Link href="/documents/list" className="p-8 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl transition shadow-sm hover:shadow-md group space-y-3 text-left block">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                            📚
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">문서 목록</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                내가 열람할 수 있는 문서와 검색 반영 상태를 확인합니다.
                            </p>
                        </div>
                    </Link>

                    <Link href="/groups" className="p-8 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl transition shadow-sm hover:shadow-md group space-y-3 text-left block">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                            👥
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">그룹 관리</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                팀, 스터디, 개인 공간 그룹을 만들고 이메일로 멤버를 추가합니다.
                            </p>
                        </div>
                    </Link>
                </section>

            </main>
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <MainDashboard />
        </Suspense>
    );
}