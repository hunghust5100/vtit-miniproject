import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon success" size={20} />;
      case 'error':
        return <XCircle className="toast-icon error" size={20} />;
      case 'warning':
        return <AlertCircle className="toast-icon warning" size={20} />;
      default:
        return <Info className="toast-icon info" size={20} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      {/* Toast Portal/Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card ${toast.type}`}>
            <div className="toast-content-wrapper">
              {getIcon(toast.type)}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
            <div className="toast-progress-bar" style={{ animationDuration: `${toast.duration || 3000}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
