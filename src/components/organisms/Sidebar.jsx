import React from 'react';
import { LayoutGrid, Users, BarChart3, FileText, Settings, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const navItems = [
    { icon: LayoutGrid, active: true },
    { icon: Users },
    { icon: BarChart3 },
    { icon: FileText },
    { icon: Settings },
  ];

  return (
    <aside className="w-20 bg-surface border-r border-gray-100 flex flex-col items-center py-6 h-screen sticky top-0">
      {/* Logo */}
      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-primary mb-8 shadow-sm">
        <TrendingUp className="w-6 h-6" />
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-4 flex-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
                item.active 
                  ? "bg-gray-100 text-content-main shadow-inner" 
                  : "text-gray-400 hover:text-content-main hover:bg-gray-50"
              )}
            >
              <Icon className={cn("w-5 h-5", item.active && "text-content-main")} />
              {item.active && (
                <div className="absolute -right-4 w-1 h-8 bg-primary rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile/Logo */}
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer hover:bg-purple-100 transition-colors">
          EA
        </div>
      </div>
    </aside>
  );
}
