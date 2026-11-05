'line spacing: 1.25';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/api/apiClient';
import { memberApi } from '@/api/memberApi';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !password.trim() || isLoading) return;

    try {
      // 가입 시에는 이름 / 이메일 / 비밀번호만 전송 (부서 그룹은 가입 후 지정)
      await memberApi.register({
        email: email.trim(),
        password: password,
        userName: name.trim()
      });

      alert('🎉 회원가입 성공!\n로그인 후 메인 대시보드에서 나만의 워크스페이스(그룹)를 개설해 보세요.');
      window.location.href='/login'
    } catch (err) {
      if (err instanceof ApiError) {
        // 백엔드 오류 메시지 표시 (예: "이미 존재하는 이메일입니다.")
        setErrorMsg(err.message);
      } else {
        setErrorMsg('서버와 통신 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        
        {/* 타이틀 헤더 */}
        <div className="text-center space-y-1.5">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">👤 회원가입</h1>
          <p className="text-xs md:text-sm text-slate-500">
            가입한 뒤 그룹을 만들거나, 그룹 OWNER에게 이메일로 추가를 요청하세요.
          </p>
        </div>

        {/* 백엔드 오류 메시지 */}
        {errorMsg && (
          <div className="p-3.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="양경빈"
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kyungbin@company.com"
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8자리 이상 안전한 비밀번호"
              required
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !name.trim() || !password.trim()}
            className="w-full py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm"
          >
            {isLoading ? '가입 중...' : '계정 만들기'}
          </button>
        </form>

        {/* 기존 유저 로그인 유도 */}
        <p className="text-center text-xs text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            여기서 로그인하기
          </Link>
        </p>

      </div>
    </div>
  );
}