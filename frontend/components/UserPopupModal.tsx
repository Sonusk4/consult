import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import '../styles/UserPopupModal.css';

interface UserPopupModalProps {
  open: boolean;
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info';
  onClose: () => void;
}

const UserPopupModal: React.FC<UserPopupModalProps> = ({
  open,
  title,
  message,
  icon,
  onClose
}) => {
  if (!open) return null;

  const getIcon = () => {
    switch (icon) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPopupModal;
