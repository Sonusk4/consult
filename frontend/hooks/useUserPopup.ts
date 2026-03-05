import { useState } from 'react';

interface PopupState {
  open: boolean;
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info';
  showBuyCredits: boolean;   // ⭐ ADD THIS
}

export const useUserPopup = () => {
  const [popup, setPopup] = useState<PopupState>({
    open: false,
    title: '',
    message: '',
    icon: 'info',
    showBuyCredits: false   // ⭐ DEFAULT
  });

  // ⭐ Modified to support buyCredits flag
  const showPopup = (
    title: string,
    message: string,
    icon: 'success' | 'error' | 'info' = 'info',
    showBuyCredits: boolean = false
  ) => {
    setPopup({
      open: true,
      title,
      message,
      icon,
      showBuyCredits
    });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, open: false }));
  };

  const showSuccess = (title: string, message: string) => {
    showPopup(title, message, 'success');
  };

  const showError = (
    title: string,
    message: string,
    showBuyCredits: boolean = false     // ⭐ allow passing buyCredits
  ) => {
    showPopup(title, message, 'error', showBuyCredits);
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