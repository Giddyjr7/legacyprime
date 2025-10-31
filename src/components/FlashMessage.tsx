import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

type FlashMessageVariant = 'success' | 'error' | 'warning' | 'pending' | 'info';

type FlashMessageProps = {
  message: string;
  variant?: FlashMessageVariant;
  onClose?: () => void;
  duration?: number; // ms
};

const variantStyles = {
  success: {
    border: 'border-green-500',
    bg: 'bg-green-500',
    icon: CheckCircle,
  },
  error: {
    border: 'border-red-500',
    bg: 'bg-red-500',
    icon: XCircle,
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500',
    icon: AlertCircle,
  },
  pending: {
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    icon: Clock,
  },
  info: {
    border: 'border-crypto-purple',
    bg: 'bg-crypto-purple',
    icon: AlertCircle,
  },
};

export default function FlashMessage({ 
  message, 
  variant = 'info', 
  onClose, 
  duration = 10000 
}: FlashMessageProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className={`fixed left-1/2 top-6 z-50 w-[min(720px,90%)] -translate-x-1/2 rounded-lg border ${styles.border} ${styles.bg} px-4 py-3 shadow-md`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-white" />
          <div className="text-sm font-medium text-white">{message}</div>
        </div>
        <button
          onClick={() => onClose && onClose()}
          className="text-white/90 opacity-90 hover:opacity-100 text-sm"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    </div>
  );
}
