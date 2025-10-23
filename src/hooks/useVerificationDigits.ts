import { useState, useCallback } from 'react';

interface UseVerificationDigitsReturn {
  digits: string[];
  fullCode: string;
  handleDigitChange: (index: number, value: string) => void;
  handleDigitKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleDigitPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  resetDigits: () => void;
}

/**
 * 6자리 인증번호 입력을 관리하는 커스텀 훅
 */
export const useVerificationDigits = (
  digitCount: number = 6
): UseVerificationDigitsReturn => {
  const [digits, setDigits] = useState<string[]>(Array(digitCount).fill(''));

  const fullCode = digits.join('');

  const handleDigitChange = useCallback((index: number, value: string) => {
    // 숫자만 허용
    if (value && !/^\d$/.test(value)) return;
    
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    
    // 자동으로 다음 필드로 이동
    if (value && index < digitCount - 1) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  }, [digits, digitCount]);

  const handleDigitKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  }, [digits]);

  const handleDigitPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, ''); // 숫자만 추출
    
    if (pastedData.length === digitCount) {
      const newDigits = pastedData.split('').slice(0, digitCount);
      setDigits(newDigits);
      
      // 마지막 필드로 포커스 이동
      const lastInput = document.getElementById(`digit-${digitCount - 1}`);
      lastInput?.focus();
    }
  }, [digitCount]);

  const resetDigits = useCallback(() => {
    setDigits(Array(digitCount).fill(''));
  }, [digitCount]);

  return {
    digits,
    fullCode,
    handleDigitChange,
    handleDigitKeyDown,
    handleDigitPaste,
    resetDigits
  };
};

