import { passwordResetCodeTtlSeconds } from '@health/shared';
import { useEffect, useState } from 'react';

const millisecondsPerSecond = 1000;

type UsePasswordResetCountdownResult = {
  countdownSeconds: number | null;
  canResendCode: boolean;
  startCountdown: () => void;
  stopCountdown: () => void;
};

export function usePasswordResetCountdown(): UsePasswordResetCountdownResult {
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const countdownSeconds = expiresAtMs
    ? Math.max(0, Math.ceil((expiresAtMs - currentTimeMs) / millisecondsPerSecond))
    : null;

  useEffect(() => {
    if (!expiresAtMs) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, millisecondsPerSecond);

    return () => {
      clearInterval(intervalId);
    };
  }, [expiresAtMs]);

  function startCountdown() {
    const nowMs = Date.now();

    setCurrentTimeMs(nowMs);
    setExpiresAtMs(nowMs + passwordResetCodeTtlSeconds * millisecondsPerSecond);
  }

  return {
    countdownSeconds,
    canResendCode: countdownSeconds === 0,
    startCountdown,
    stopCountdown: () => {
      setExpiresAtMs(null);
    }
  };
}
