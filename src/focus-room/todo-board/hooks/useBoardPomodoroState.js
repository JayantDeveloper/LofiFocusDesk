import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const FOCUS_SESSIONS_STORAGE_KEY = "focusdesk-pomodoro-focus-sessions";
const COMPLETION_ALARM_SRC = "/freesound_community-alarm-clock-short-6402.mp3";
const COMPLETION_ALARM_PREVIEW_MS = 3000;

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
  const completionAudioRef = useRef(null);
  const stopAlarmTimeoutRef = useRef(null);

  const playCompletionRing = useCallback(() => {
    if (!completionAudioRef.current) {
      const audio = new Audio(COMPLETION_ALARM_SRC);
      audio.preload = "auto";
      completionAudioRef.current = audio;
    }

    const alarm = completionAudioRef.current;
    if (!alarm) return;

    if (stopAlarmTimeoutRef.current) {
      window.clearTimeout(stopAlarmTimeoutRef.current);
      stopAlarmTimeoutRef.current = null;
    }

    try {
      alarm.pause();
      alarm.currentTime = 0;
    } catch {
      return;
    }

    const playPromise = alarm.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }

    stopAlarmTimeoutRef.current = window.setTimeout(() => {
      alarm.pause();
      alarm.currentTime = 0;
      stopAlarmTimeoutRef.current = null;
    }, COMPLETION_ALARM_PREVIEW_MS);
  }, []);

  useEffect(
    () => () => {
      if (stopAlarmTimeoutRef.current) {
        window.clearTimeout(stopAlarmTimeoutRef.current);
      }

      if (completionAudioRef.current) {
        completionAudioRef.current.pause();
        completionAudioRef.current.currentTime = 0;
      }
    },
    [],
  );

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
