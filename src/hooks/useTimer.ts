import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  timeLeft: number;
  isTimerExpired: boolean;
  startTimer: (duration: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimer = (initialTime: number = 0): UseTimerReturn => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((duration: number) => {
    setTimeLeft(duration);
    setIsTimerExpired(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setIsTimerExpired(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(initialTime);
    setIsTimerExpired(false);
  }, [stopTimer, initialTime]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    timeLeft,
    isTimerExpired,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime
  };
};
