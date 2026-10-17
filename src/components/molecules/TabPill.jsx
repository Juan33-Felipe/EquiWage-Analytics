import React from 'react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';

export function TabPill({ tabs, activeTab, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="tab-pill-container flex items-center bg-gray-100/80 p-1 rounded-full shadow-inner">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            activeTab === tab.id
              ? "tab-pill-active bg-black text-white shadow-md"
              : "text-content-muted hover:text-content-main hover:bg-gray-200/50"
          )}
        >
          {t(`header.${tab.label}`)}
        </button>
      ))}
    </div>
  );
}
