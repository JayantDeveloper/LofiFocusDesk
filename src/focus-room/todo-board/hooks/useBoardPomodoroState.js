import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const FOCUS_SESSIONS_STORAGE_KEY = "focusdesk-pomodoro-focus-sessions";

function getInitialFocusSessions() {
  try {
    const rawValue = window.localStorage.getItem(FOCUS_SESSIONS_STORAGE_KEY);
    const parsed = Number.parseInt(rawValue ?? "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function useBoardPomodoroState() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(getInitialFocusSessions);
  const audioContextRef = useRef(null);

  const playCompletionRing = useCallback(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const notes = [
      { frequency: 659.25, offset: 0 },
      { frequency: 783.99, offset: 0.2 },
      { frequency: 659.25, offset: 0.42 },
    ];

    const baseTime = context.currentTime + 0.02;
    notes.forEach(({ frequency, offset }) => {
      const startTime = baseTime + offset;
      const endTime = startTime + 0.42;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.018, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.02);
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FOCUS_SESSIONS_STORAGE_KEY, String(completedFocusSessions));
    } catch {
      return undefined;
    }
  }, [completedFocusSessions]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          playCompletionRing();
          if (!isBreak) {
            setCompletedFocusSessions((previousCount) => previousCount + 1);
          }
          const nextIsBreak = !isBreak;
          setIsBreak(nextIsBreak);
          setIsRunning(true);
          return nextIsBreak ? BREAK_SECONDS : WORK_SECONDS;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, isBreak, playCompletionRing]);

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
      completedFocusSessions,
      resetTimer,
      switchMode,
      timeLeft,
      toggleRunning,
    }),
    [completedFocusSessions, isBreak, isRunning, resetTimer, switchMode, timeLeft, toggleRunning],
  );
}
