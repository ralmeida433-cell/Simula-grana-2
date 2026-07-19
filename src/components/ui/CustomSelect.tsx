import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  groups, 
  placeholder, 
  className, 
  icon 
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMobile && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (!isMobile) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, isMobile]);

  // Normalize options to render both flat and grouped lists
  const allOptions: SelectOption[] = groups 
    ? groups.flatMap(g => g.options)
    : options;

  const selectedOption = allOptions.find(opt => opt.value === String(value));

  // Filter options based on search query
  const filterOption = (opt: SelectOption) => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredOptions = searchQuery 
    ? options.filter(filterOption) 
    : options;

  const filteredGroups = searchQuery && groups
    ? groups.map(g => ({
        ...g,
        options: g.options.filter(filterOption)
      })).filter(g => g.options.length > 0)
    : groups;

  // Show search if options count is large (e.g. > 7 options)
  const showSearch = allOptions.length > 7;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const renderOptionItem = (option: SelectOption) => {
    const isSelected = option.value === String(value);
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => handleSelect(option.value)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-sm transition-all duration-200 relative group text-left rounded-xl my-0.5",
          isSelected 
            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 font-semibold" 
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium"
        )}
      >
        <div className="flex flex-col gap-0.5 truncate pr-4">
          <span className="truncate">{option.label}</span>
          {option.description && (
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-normal">
              {option.description}
            </span>
          )}
        </div>
        
        {/* Custom premium radio-like indicator */}
        <div className="flex items-center justify-center shrink-0">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            isSelected 
              ? "border-emerald-500 bg-emerald-500 dark:bg-emerald-400 dark:border-emerald-400 scale-100" 
              : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500 scale-95"
          )}>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-white dark:bg-slate-950"
              />
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderContent = () => (
    <div className="flex flex-col h-full max-h-[80vh] sm:max-h-[400px]">
      {/* Search Header */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-[#1A1C23]/95 backdrop-blur-md z-10 rounded-t-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      )}

      {/* Options List */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {filteredGroups ? (
          filteredGroups.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
              Nenhuma opção encontrada
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <div className="px-4 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase select-none">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.options.map(renderOptionItem)}
                </div>
              </div>
            ))
          )
        ) : (
          filteredOptions.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
              Nenhuma opção encontrada
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredOptions.map(renderOptionItem)}
            </div>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Selected Box Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 outline-none",
          "bg-white dark:bg-[#15171C] border rounded-2xl shadow-sm cursor-pointer",
          isOpen 
            ? "border-emerald-500 ring-2 ring-emerald-500/10 dark:border-emerald-500" 
            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
        )}
      >
        <span className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
          {icon && <span className="text-slate-500 shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : (placeholder || 'Selecione...')}</span>
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-slate-400 shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Render select window dropdown / modal sheet */}
      <AnimatePresence>
        {isOpen && (
          isMobile ? (
            // Mobile: Gorgeous Bottom Sheet Overlay
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[999] bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-[#1A1C23] rounded-t-3xl shadow-2xl border-t border-slate-100 dark:border-slate-800/80 pb-safe"
              >
                {/* Drag Handle Bar */}
                <div className="flex justify-center py-3">
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Mobile Title with Close button */}
                <div className="flex items-center justify-between px-5 pb-2">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {placeholder || 'Selecione uma opção'}
                  </span>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-full bg-slate-50 dark:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-2">
                  {renderContent()}
                </div>
              </motion.div>
            </>
          ) : (
            // Desktop: Popover Dropdown
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute z-[100] w-full mt-2 outline-none origin-top"
            >
              <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C23] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5">
                {renderContent()}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
