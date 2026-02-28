import { useState } from 'react';

interface PopupState {
  open: boolean;
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info';
}

export const useUserPopup = () => {
  const [popup, setPopup] = useState<PopupState>({
    open: false,
    title: '',
    message: '',
    icon: 'info'
  });

  const showPopup = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info') => {
    setPopup({
      open: true,
      title,
      message,
      icon
    });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, open: false }));
  };

  const showSuccess = (title: string, message: string) => {
    showPopup(title, message, 'success');
  };

  const showError = (title: string, message: string) => {
    showPopup(title, message, 'error');
  };

  const showInfo = (title: string, message: string) => {
    showPopup(title, message, 'info');
  };

  return {
    popup,
    showPopup,
    hidePopup,
    showSuccess,
    showError,
    showInfo
  };
};
