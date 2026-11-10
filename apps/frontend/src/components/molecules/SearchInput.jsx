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
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-content-muted group-focus-within:text-primary transition-colors">
          <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
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
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('search.placeholder')}
          className="w-56 xl:w-72 bg-white/60 dark:bg-[#181920]/80 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-full py-2 pl-10 pr-12 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-content-muted shadow-[0_2px_8px_rgba(0,0,0,0.03)] truncate"
        />
        <div className="absolute right-3.5 flex items-center">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border dark:border-white/10 bg-surface-light dark:bg-white/[0.06] text-[10px] font-medium text-content-muted font-sans">
            <span className="text-xs">⌘</span> K
          </kbd>
        </div>
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface/95 dark:bg-[#1A1A23]/95 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-white/10 p-2 z-50 shadow-soft">
          {results.length === 0 && (
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors text-left"
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
