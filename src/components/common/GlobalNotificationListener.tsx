import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL, getStoredToken } from '../../services/api';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: number;
}

export function GlobalNotificationListener() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Only connect to SSE if the user is logged in
    if (!isAuthenticated) return;
    
    const token = getStoredToken();
    if (!token) return;

    let eventSource: EventSource | null = null;
    let retryTimeout: any;

    const connect = () => {
      eventSource = new EventSource(`${API_BASE_URL}/events/stream?token=${token}`);

      const handleEvent = (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          
          const newToast: Toast = {
            id: payload.id || Date.now().toString(),
            title: payload.title || 'New Notification',
            message: payload.message || '',
            type: payload.type || 'SYSTEM',
            createdAt: Date.now()
          };
          
          setToasts(prev => [newToast, ...prev]);

          // Auto-remove toast after 6 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newToast.id));
          }, 6000);
        } catch (err) {
          console.error("[SSE Error] Failed to parse event", err);
        }
      };

      // Listen for both global broadcasts and user-specific notifications
      eventSource.addEventListener('notification:broadcast', handleEvent);
      eventSource.addEventListener('notification:new', handleEvent);
      eventSource.addEventListener('system:alert', handleEvent);

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 10 seconds if connection drops
        retryTimeout = setTimeout(connect, 10000); 
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(retryTimeout);
    };
  }, [isAuthenticated]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          onClick={() => {
             // Navigate to the notifications page when clicked
             navigate('/notifications');
             setToasts(prev => prev.filter(t => t.id !== toast.id));
          }}
          className="bg-white border-l-4 border-[#85431E] rounded-tr-xl rounded-bl-xl shadow-[0_10px_40px_-10px_rgba(52,21,15,0.3)] p-4 flex items-start gap-3 cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95 duration-200 animate-in slide-in-from-bottom-8 fade-in"
        >
          <div className="bg-[#f5e8d4] text-[#85431E] p-2.5 rounded-full flex-shrink-0 mt-0.5">
            <Bell size={18} className="animate-[wiggle_1s_ease-in-out_infinite]" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="text-[15px] font-extrabold text-[#34150F] truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {toast.title}
            </h4>
            <p className="text-xs text-[#85431E]/80 line-clamp-2 mt-1 leading-snug">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
            className="text-gray-300 hover:text-[#85431E] hover:bg-[#85431E]/10 rounded-full p-1 transition-colors mt-0.5"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
