import React from 'react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';

export function TabPill({ tabs, activeTab, onChange, className }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "flex items-center bg-white/60 dark:bg-[#181920]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 p-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-sm",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/35 border border-white/30 scale-[1.02]"
                : "text-content-muted hover:text-content-main hover:bg-white/50 dark:hover:bg-white/10"
            )}
          >
            {t(`header.${tab.label}`)}
          </button>
        );
      })}
    </div>
  );
}
