import React from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { Header } from '../organisms/Header';

export function DashboardLayout({ children, activeTab, onTabChange }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <Header activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex-1 p-8 pt-2 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
