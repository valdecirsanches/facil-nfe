import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from 'lucide-react';
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}
export function Toast({
  type,
  message,
  onClose,
  duration = 5000
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  const config = {
    success: {
      icon: CheckCircleIcon,
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-white',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      textColor: 'text-gray-900'
    },
    error: {
      icon: XCircleIcon,
      gradient: 'from-red-500 to-rose-500',
      bg: 'bg-white',
      border: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-gray-900'
    },
    warning: {
      icon: AlertTriangleIcon,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-white',
      border: 'border-amber-200',
      iconColor: 'text-amber-600',
      textColor: 'text-gray-900'
    },
    info: {
      icon: InfoIcon,
      gradient: 'from-blue-500 to-indigo-500',
      bg: 'bg-white',
      border: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-gray-900'
    }
  };
  const Icon = config[type].icon;
  return <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`${config[type].bg} border ${config[type].border} rounded-xl shadow-2xl max-w-md overflow-hidden`}>
        <div className={`h-1 bg-gradient-to-r ${config[type].gradient}`}></div>
        <div className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config[type].gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`${config[type].textColor} font-medium leading-relaxed`}>
              {message}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
            <XIcon size={18} />
          </button>
        </div>
      </div>
    </div>;
}
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>;
  onRemove: (id: string) => void;
}
export function ToastContainer({
  toasts,
  onRemove
}: ToastContainerProps) {
  return <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map(toast => <div key={toast.id} className="pointer-events-auto">
          <Toast type={toast.type} message={toast.message} onClose={() => onRemove(toast.id)} />
        </div>)}
    </div>;
}