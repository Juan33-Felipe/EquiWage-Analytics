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

  // Atajo visual ⌘K / Ctrl+K para enfocar el buscador.
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
        <div className="absolute left-3 text-gray-400 group-focus-within:text-primary transition-colors">
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
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('search.placeholder')}
          className="w-52 xl:w-64 bg-surface border border-gray-200 rounded-full py-2 pl-9 pr-12 text-sm text-content-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-gray-400 shadow-sm truncate"
        />
        <div className="absolute right-3 flex items-center">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-500 font-sans">
            <span className="text-xs">⌘</span> K
          </kbd>
        </div>
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-soft border border-gray-100 p-2 z-50">
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
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
