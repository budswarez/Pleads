import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: '#1f2937',
        color: '#f9fafb',
        border: '1px solid #374151',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#22c55e',
          secondary: '#fff',
        },
      },
      error: {
        duration: 4000,
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
);
