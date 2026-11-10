import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from '../organisms/Sidebar';
import { Header } from '../organisms/Header';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background dark:bg-[#0E0A08] relative overflow-hidden selection:bg-primary/20 w-full transition-colors duration-300">
      {/* Blazing CoinSphere Ambient Orange Glow Layer */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Massive Radiant Orange Flare at Top-Right (CoinSphere Signature Glow) */}
        <div className="absolute -top-48 -right-48 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-orange-500/55 via-amber-500/35 to-transparent blur-[120px] dark:from-orange-500/50 dark:via-amber-500/30 pointer-events-none" />

        {/* Powerful Upper Center Warm Amber-Orange Aurora */}
        <div className="absolute -top-28 left-1/4 w-[750px] h-[600px] rounded-full bg-gradient-to-b from-orange-600/40 via-amber-600/25 to-transparent blur-[130px] pointer-events-none" />

        {/* Ambient Warm Orange Wash at Bottom */}
        <div className="absolute -bottom-48 -left-32 w-[900px] h-[900px] rounded-full bg-gradient-to-tr from-orange-600/40 via-amber-600/25 to-transparent blur-[140px] dark:from-orange-600/35 dark:via-amber-600/20 pointer-events-none" />

        {/* Lateral Ambient Glow at Bottom-Right */}
        <div className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-orange-500/30 via-primary/20 to-transparent blur-[130px] pointer-events-none" />

        {/* Central Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full bg-orange-500/12 blur-[180px] pointer-events-none" />
      </div>

      {/* Sidebar with Desktop Sticky & Mobile Drawer Support */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area — Strictly bounded to prevent horizontal overflows */}
      <main className="flex-1 flex flex-col h-screen min-w-0 w-full relative z-10 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex-1 p-3 sm:p-5 lg:p-8 pt-3 sm:pt-4 overflow-y-auto overflow-x-hidden min-w-0 w-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
