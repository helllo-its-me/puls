import { useEffect, useState } from 'react';

const millisecondsPerSecond = 1000;

type UsePasswordResetCountdownResult = {
  countdownSeconds: number | null;
  canResendCode: boolean;
  startCountdown: (expiresAt: string) => void;
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

  function startCountdown(expiresAt: string) {
    const nowMs = Date.now();

    setCurrentTimeMs(nowMs);
    setExpiresAtMs(Date.parse(expiresAt));
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
