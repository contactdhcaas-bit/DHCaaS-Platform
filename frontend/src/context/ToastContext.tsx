// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast('info', message, duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastConfig = (type: ToastType) => {
    const configs = {
      success: {
        icon: CheckCircle2,
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500',
        iconColor: 'text-green-400',
        textColor: 'text-green-100',
      },
      error: {
        icon: XCircle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500',
        iconColor: 'text-red-400',
        textColor: 'text-red-100',
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500',
        iconColor: 'text-blue-400',
        textColor: 'text-blue-100',
      },
      warning: {
        icon: AlertCircle,
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500',
        iconColor: 'text-yellow-400',
        textColor: 'text-yellow-100',
      },
    };
    return configs[type];
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 min-w-[320px] max-w-md p-4 
                ${config.bgColor} ${config.borderColor} border-l-4 
                bg-[#0B1120] rounded-xl shadow-2xl backdrop-blur-sm
                animate-slideInRight pointer-events-auto
              `}
            >
              <div className={`flex-shrink-0 ${config.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className={`flex-1 text-sm font-medium ${config.textColor}`}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
