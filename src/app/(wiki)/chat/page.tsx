import ChatWindow from '@/component/wiki/ChatWindow';
import PageHeader from '@/component/ui/PageHeader';

export default function WikiChatPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <PageHeader
        title="위키 검색"
        description="내가 속한 그룹에 공개된 문서만 검색해서 답변합니다. 다른 그룹의 문서는 답변에 사용되지 않습니다."
      />
      <ChatWindow />
    </div>
  );
}
