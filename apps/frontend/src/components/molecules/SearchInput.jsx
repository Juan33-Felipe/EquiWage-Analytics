import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formatCurrency, getInitials, useCompensation } from '../../context/CompensationContext';
import { useLanguage } from '../../context/LanguageContext';
import { Avatar } from '../atoms/Avatar';

export function SearchInput() {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { employees } = useCompensation();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return employees
      .filter(
        (employee) =>
          employee.name.toLowerCase().includes(term) ||
          employee.role.toLowerCase().includes(term) ||
          employee.id.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [employees, query]);

  return (
    <div className="relative group">
      {/* Expanded Input for Large Screens, Expandable on Smaller */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="md:hidden 2xl:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-center text-content-muted hover:text-primary active:scale-95 transition-all cursor-pointer shadow-xs"
          title={t('search.placeholder')}
          aria-label={t('search.placeholder')}
        >
          <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Full input on 2xl or desktop */}
        <div className="hidden 2xl:flex relative items-center">
          <div className="absolute left-3.5 text-content-muted group-focus-within:text-primary transition-colors pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            placeholder={t('search.placeholder')}
            className="w-48 xl:w-56 bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-full py-2 pl-9 pr-11 text-xs sm:text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-content-muted shadow-xs truncate"
          />
          <div className="absolute right-3 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border dark:border-white/10 bg-surface-light dark:bg-white/[0.06] text-[10px] font-medium text-content-muted font-sans">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Compact Icon Bubble on screens below 2xl */}
        <div className="hidden md:flex 2xl:hidden relative items-center">
          <button
            type="button"
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl border border-white/80 dark:border-white/10 flex items-center justify-center text-content-muted hover:text-primary active:scale-95 transition-all cursor-pointer shadow-xs"
            title={t('search.placeholder')}
            aria-label={t('search.placeholder')}
          >
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* Floating Search Popover / Dropdown when clicked on compact bubble */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface/95 dark:bg-[#1A1A23]/95 backdrop-blur-2xl rounded-2xl border border-white/60 dark:border-white/10 p-2.5 z-50 shadow-soft">
          {/* Internal Input in dropdown for compact screen mode */}
          <div className="2xl:hidden relative flex items-center mb-2 px-1">
            <Search className="w-4 h-4 absolute left-3.5 text-content-muted" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-white/80 dark:bg-black/30 border border-border dark:border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs sm:text-sm text-content-main focus:outline-none focus:border-primary/50"
            />
          </div>

          {query.trim() && results.length === 0 && (
            <p className="text-xs text-content-muted px-3 py-3">{t('search.noEmployees', { query })}</p>
          )}
          {results.map((employee) => (
            <button
              key={employee.id}
              onClick={() => {
                setOpen(false);
                setQuery('');
                navigate('/employees');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
            >
              <Avatar initials={getInitials(employee.name)} className="w-8 h-8 text-xs shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-content-main truncate">{employee.name}</p>
                <p className="text-xs text-content-muted truncate">L{employee.level} • {employee.role}</p>
              </div>
              <span className="text-xs font-semibold text-content-muted shrink-0">
                {formatCurrency(employee.currentSalary)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
