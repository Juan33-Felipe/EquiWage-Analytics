import React from 'react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../context/LanguageContext';

export function TabPill({ tabs, activeTab, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="tab-pill-container flex items-center bg-surface border border-border p-1 rounded-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            activeTab === tab.id
              ? "tab-pill-active bg-primary text-white"
              : "text-content-muted hover:text-content-main"
          )}
        >
          {t(`header.${tab.label}`)}
        </button>
      ))}
    </div>
  );
}
