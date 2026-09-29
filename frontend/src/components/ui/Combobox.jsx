import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export function Combobox({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  required = false,
  disabled = false,
  error,
  hint,
  onQuickAdd,
  quickAddLabel = 'Add New',
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Find selected item
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options
  const filteredOptions = options.filter((opt) => {
    const term = search.toLowerCase();
    const labelMatch = opt.label?.toLowerCase().includes(term);
    const subtextMatch = opt.subtext?.toLowerCase().includes(term);
    return labelMatch || subtextMatch;
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={clsx('space-y-1.5 relative', className)} ref={containerRef}>
      {label && (
        <label
          className="block text-xs font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          'input-base w-full flex items-center justify-between text-left cursor-pointer transition-colors',
          isOpen && 'ring-2 ring-accent/20 border-accent',
          error && 'border-danger focus:ring-danger/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={clsx('truncate text-sm', !selectedOption && 'opacity-50')}
          style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          {selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5 text-theme-text-tertiary" />
            </span>
          )}
          <ChevronDown
            className={clsx('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl border shadow-modal overflow-hidden animate-slide-in-up"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
            minWidth: '240px'
          }}
        >
          {/* Search Bar */}
          <div
            className="p-2 border-b flex items-center gap-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-0.5 rounded hover:opacity-70"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/20">
            {filteredOptions.length === 0 ? (
              <div
                className="p-4 text-center text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No matching options found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors',
                      isSelected
                        ? 'font-semibold'
                        : 'hover:bg-[var(--surface-secondary)]'
                    )}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-muted)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.subtext && (
                        <div
                          className="text-[10px] truncate mt-0.5"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {opt.subtext}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Optional Quick Add Footer */}
          {onQuickAdd && (
            <div
              className="p-2 border-t"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-secondary)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onQuickAdd();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-accent hover:bg-accent-muted transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{quickAddLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {hint && !error && (
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
      )}
    </div>
  );
}
