import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({ title, back = true }) {
  const nav = useNavigate();
  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b border-violet-50 sticky top-0 z-10">
      {back && (
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 active:bg-violet-100">
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
      )}
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </div>
  );
}
