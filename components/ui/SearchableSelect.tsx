import React, { useEffect, useState, useRef } from 'react';
import { SearchIcon, ChevronDownIcon, XIcon } from 'lucide-react';
interface Option {
  value: string;
  label: string;
  subtitle?: string;
}
interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  className?: string;
}
export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  required = false,
  className = ''
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Filter out invalid options and then apply search filter
    const validOptions = options.filter(option => option && option.label);
    const filtered = validOptions.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()) || option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredOptions(filtered);
  }, [searchTerm, options]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find(opt => opt && opt.value === value);
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };
  return <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div onClick={() => setIsOpen(!isOpen)} className="relative w-full px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selectedOption ? <div>
                <p className="text-sm text-gray-900">{selectedOption.label}</p>
                {selectedOption.subtitle && <p className="text-xs text-gray-500">
                    {selectedOption.subtitle}
                  </p>}
              </div> : <p className="text-sm text-gray-400">{placeholder}</p>}
          </div>
          <div className="flex items-center gap-2">
            {value && <button onClick={handleClear} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <XIcon size={16} className="text-gray-400" />
              </button>}
            <ChevronDownIcon size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={searchPlaceholder} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? <div className="p-4 text-center text-sm text-gray-500">
                Nenhum resultado encontrado
              </div> : filteredOptions.map(option => <div key={option.value} onClick={() => handleSelect(option.value)} className={`px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${value === option.value ? 'bg-green-50' : ''}`}>
                  <p className="text-sm text-gray-900">{option.label}</p>
                  {option.subtitle && <p className="text-xs text-gray-500">{option.subtitle}</p>}
                </div>)}
          </div>
        </div>}
    </div>;
}