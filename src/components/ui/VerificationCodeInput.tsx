import { INPUT_STYLES } from '../../styles';

interface VerificationCodeInputProps {
  digits: string[];
  onDigitChange: (index: number, value: string) => void;
  onDigitKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onDigitPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onEnterPress?: () => void;
  disabled?: boolean;
  digitCount?: number;
}

/**
 * 6자리 인증번호 입력 UI 컴포넌트
 */
export const VerificationCodeInput = ({
  digits,
  onDigitChange,
  onDigitKeyDown,
  onDigitPaste,
  onEnterPress,
  disabled = false,
  digitCount = 6
}: VerificationCodeInputProps) => {
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter 키 처리
    if (e.key === 'Enter' && onEnterPress) {
      const fullCode = digits.join('');
      if (fullCode.length === digitCount && !disabled) {
        onEnterPress();
      }
    }
    
    // 기존 키 다운 핸들러 호출
    onDigitKeyDown(index, e);
  };

  return (
    <div className="flex justify-center gap-4 md:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`digit-${index}`}
          type="text"
          className={INPUT_STYLES.verification}
          value={digit}
          onChange={(e) => onDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? onDigitPaste : undefined}
          disabled={disabled}
          maxLength={1}
          inputMode="numeric"
        />
      ))}
    </div>
  );
};

