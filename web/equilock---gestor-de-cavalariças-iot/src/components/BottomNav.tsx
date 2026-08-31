import React from 'react';
import { AppTab } from './Header';
import { LayoutGrid, Sliders, Calendar, History } from 'lucide-react';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    {
      id: 'manual' as AppTab,
      label: 'Controlo',
      icon: <LayoutGrid className="w-5 h-5" />,
      desc: 'Baias'
    },
    {
      id: 'sequence' as AppTab,
      label: 'Sequência',
      icon: <Sliders className="w-5 h-5" />,
      desc: 'Delay'
    },
    {
      id: 'schedule' as AppTab,
      label: 'Agenda',
      icon: <Calendar className="w-5 h-5" />,
      desc: 'Horários'
    },
    {
      id: 'history' as AppTab,
      label: 'Histórico',
      icon: <History className="w-5 h-5" />,
      desc: 'Auditoria'
    }
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navegação Inferior Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[52px] py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation select-none relative ${
                isActive
                  ? 'text-[#2e5334] font-bold'
                  : 'text-stone-400 hover:text-stone-700 font-medium'
              }`}
            >
              {/* Active Pill Indicator */}
              {isActive && (
                <span className="absolute top-1 w-8 h-1 bg-[#558b5b] rounded-full animate-in fade-in zoom-in-75 duration-200"></span>
              )}

              <div
                className={`p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-[#e6f4ea] text-[#2e5334]' : 'text-stone-400'
                }`}
              >
                {tab.icon}
              </div>

              <span className="text-[11px] tracking-tight mt-0.5 leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
