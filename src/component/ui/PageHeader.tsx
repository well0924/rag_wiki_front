import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
}

// 하위 페이지 공통 헤더 (홈으로 돌아가는 링크 포함)
export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200">
      <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition">← 홈으로</Link>
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-2">{title}</h1>
      {description && <p className="text-xs md:text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
