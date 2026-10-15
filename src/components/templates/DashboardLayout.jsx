import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../organisms/Sidebar';
import { Header } from '../organisms/Header';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 p-8 pt-2 overflow-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
