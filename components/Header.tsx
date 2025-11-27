import React from 'react';
import { BellIcon } from 'lucide-react';
interface HeaderProps {
  title: string;
}
export function Header({
  title
}: HeaderProps) {
  return <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Notificações">
            <BellIcon size={20} />
          </button>
        </div>
      </div>
    </header>;
}