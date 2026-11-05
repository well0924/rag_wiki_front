'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ApiError } from '@/api/apiClient';
import { searchApi } from '@/api/searchApi';
import { SearchSource } from '@/types/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  historyId?: number;            // 피드백 전송용 (실제 검색 답변에만 존재)
  feedback?: boolean | null;     // 전송한 피드백 (true 👍 / false 👎)
  sources?: SearchSource[];      // 답변 근거 문서
  isError?: boolean;
}

const now = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! 위키 어시스턴트입니다. 내가 속한 그룹에 공개된 문서를 바탕으로 답변해 드립니다. 무엇이든 물어보세요.',
      timestamp: '방금 전',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: userQuery, timestamp: now() },
    ]);
    setIsLoading(true);

    try {
      const response = await searchApi.search(userQuery);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${response.historyId}`,
          role: 'assistant',
          content: response.answer,
          timestamp: now(),
          historyId: response.historyId,
          feedback: null,
          sources: response.sources ?? [],
        },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', content: message, timestamp: now(), isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, historyId: number, isPositive: boolean) => {
    // 먼저 화면에 반영하고, 실패하면 되돌림
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: isPositive } : m)));
    try {
      await searchApi.sendFeedback(historyId, isPositive);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: null } : m)));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 챗 상단 바 */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <h2 className="font-bold text-slate-800 text-sm md:text-base">문서 검색</h2>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-1.5 px-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">출처</span>
                  {msg.sources.map((source, i) => (
                    <span
                      key={source.documentId}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                      title={`질문과의 유사도 ${Math.round(source.similarity * 100)}%`}
                    >
                      [{i + 1}] {source.title}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                {msg.historyId !== undefined && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback(msg.id, msg.historyId!, true)}
                      disabled={msg.feedback !== null}
                      className={`text-xs p-0.5 rounded transition disabled:cursor-default ${
                        msg.feedback === true ? 'bg-emerald-100' : msg.feedback === false ? 'opacity-30' : 'hover:bg-slate-200'
                      }`}
                      title="도움이 됐어요"
                    >👍</button>
                    <button
                      onClick={() => handleFeedback(msg.id, msg.historyId!, false)}
                      disabled={msg.feedback !== null}
                      className={`text-xs p-0.5 rounded transition disabled:cursor-default ${
                        msg.feedback === false ? 'bg-rose-100' : msg.feedback === true ? 'opacity-30' : 'hover:bg-slate-200'
                      }`}
                      title="도움이 안 됐어요"
                    >👎</button>
                    {msg.feedback !== null && <span className="text-[10px] text-slate-400">피드백 감사합니다</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs text-slate-400 font-medium">관련 문서를 찾는 중...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 배포는 언제 진행하나요?"
          maxLength={1000}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition shadow-sm whitespace-nowrap"
        >
          보내기
        </button>
      </form>
    </div>
  );
}
