import { useCallback, useEffect, useMemo, useState } from "react";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function useBoardPomodoroState() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          const nextIsBreak = !isBreak;
          setIsBreak(nextIsBreak);
          setIsRunning(true);
          return nextIsBreak ? BREAK_SECONDS : WORK_SECONDS;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, isBreak]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_SECONDS : WORK_SECONDS);
  }, [isBreak]);

  const switchMode = useCallback((nextIsBreak) => {
    setIsRunning(false);
    setIsBreak(nextIsBreak);
    setTimeLeft(nextIsBreak ? BREAK_SECONDS : WORK_SECONDS);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  return useMemo(
    () => ({
      isBreak,
      isRunning,
      resetTimer,
      switchMode,
      timeLeft,
      toggleRunning,
    }),
    [isBreak, isRunning, resetTimer, switchMode, timeLeft, toggleRunning],
  );
}
