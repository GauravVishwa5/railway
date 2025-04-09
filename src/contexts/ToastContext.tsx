import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  id: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`mb-2 p-4 rounded shadow-lg animate-pop ${
              toast.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
              toast.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
              'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
            }`}
          >
            {toast.message}
            <button
              className="ml-4 text-gray-500 hover:text-gray-700"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};