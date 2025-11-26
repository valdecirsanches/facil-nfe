import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}
export function Input({
  label,
  error,
  rightIcon,
  className = '',
  ...props
}: InputProps) {
  return <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>}
      <div className="relative">
        <input className={`w-full px-3 py-2 ${rightIcon ? 'pr-10' : ''} border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'} ${className}`} {...props} />
        {rightIcon && <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>;
}