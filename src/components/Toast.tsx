import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-[#3FA56B] shrink-0" />;
        let borderColor = 'border-[#3FA56B]/30';
        let bgLight = 'bg-white';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-[#D9535F] shrink-0" />;
          borderColor = 'border-[#D9535F]/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-[#E4A72C] shrink-0" />;
          borderColor = 'border-[#E4A72C]/30';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-[#4F86C6] shrink-0" />;
          borderColor = 'border-[#4F86C6]/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${borderColor} ${bgLight} transition-all duration-200 animate-in slide-in-from-bottom-5`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#29252A] leading-tight">{toast.title}</h4>
              <p className="text-xs text-[#756B70] mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#756B70] hover:text-[#29252A] p-1 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
