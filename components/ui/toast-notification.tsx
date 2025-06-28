"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastState {
  show: boolean;
  message: string;
  title?: string;
  type: ToastType;
}

interface ToastNotificationProps {
  toast: ToastState;
  onClose: () => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const bgColor = 
    toast.type === 'success' ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
    toast.type === 'error' ? 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
    toast.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
    'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';

  const IconComponent = 
    toast.type === 'success' ? CheckCircle : 
    toast.type === 'error' ? AlertCircle :
    toast.type === 'warning' ? AlertCircle :
    Info;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md rounded-md border p-4 shadow-md ${bgColor}`}>
      <div className="flex items-start gap-3">
        <IconComponent className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          {toast.title && (
            <h4 className="font-medium">{toast.title}</h4>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook for managing toast state
export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    setToastState({
      show: true,
      message,
      type,
      title
    });
  };

  const hideToast = () => {
    setToastState((prev: ToastState) => ({ ...prev, show: false }));
  };

  return {
    toastState,
    showToast,
    hideToast
  };
}
