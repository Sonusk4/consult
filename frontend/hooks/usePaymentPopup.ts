import { useState } from 'react';

interface PaymentPopupState {
  open: boolean;
  title: string;
  message: string;
  icon: 'success' | 'error' | 'info';
}

export const usePaymentPopup = () => {
  const [popup, setPopup] = useState<PaymentPopupState>({
    open: false,
    title: '',
    message: '',
    icon: 'info'
  });

  const showPaymentPopup = (title: string, message: string, icon: 'success' | 'error' | 'info' = 'info') => {
    setPopup({
      open: true,
      title,
      message,
      icon
    });
  };

  const hidePaymentPopup = () => {
    setPopup(prev => ({ ...prev, open: false }));
  };

  const showPaymentSuccess = (title: string, message: string) => {
    showPaymentPopup(title, message, 'success');
  };

  const showPaymentError = (title: string, message: string) => {
    showPaymentPopup(title, message, 'error');
  };

  const showPaymentInfo = (title: string, message: string) => {
    showPaymentPopup(title, message, 'info');
  };

  return {
    popup,
    showPaymentPopup,
    hidePaymentPopup,
    showPaymentSuccess,
    showPaymentError,
    showPaymentInfo
  };
};
