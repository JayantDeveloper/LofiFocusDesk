import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../../../api/client";
import { useAuth } from "../../../auth/AuthContext";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const COMPLETION_ALARM_SRC = "/freesound_community-alarm-clock-short-6402.mp3";
const COMPLETION_ALARM_PREVIEW_MS = 3000;

export function useBoardPomodoroState() {
  const { user } = useAuth();
  const authSessionKey = user ? `${user.id ?? user.username ?? "user"}` : "";
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const completionAudioRef = useRef(null);
  const stopAlarmTimeoutRef = useRef(null);
  const skipHydrationSessionRef = useRef("");

  useEffect(() => {
    if (!authSessionKey) {
      skipHydrationSessionRef.current = "";
    }
  }, [authSessionKey]);

  useEffect(() => {
    if (!authSessionKey) return;
    async function load() {
      if (!user) return;
      try {
        const data = await apiRequest("/api/pomodoro");
        if (skipHydrationSessionRef.current === authSessionKey) return;
        const state = data.state || {};
        setIsRunning(state.isRunning ?? false);
        setIsBreak(state.isBreak ?? false);
        setTimeLeft(state.timeLeft ?? WORK_SECONDS);
        setCompletedFocusSessions(state.completedFocusSessions ?? 0);
      } catch {
        /* ignore */
      }
    }
    load();
  }, [authSessionKey, user]);

  useEffect(() => {
    return () => {
      if (stopAlarmTimeoutRef.current) {
        window.clearTimeout(stopAlarmTimeoutRef.current);
      }
      if (completionAudioRef.current) {
        completionAudioRef.current.pause();
        completionAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const persistState = useCallback(
    async (state) => {
      if (!user) return;
      try {
        await apiRequest("/api/pomodoro", { method: "PUT", body: state });
      } catch {}
    },
    [user],
  );

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

  useEffect(() => {
    if (!isRunning) return undefined;
    const intervalId = window.setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          playCompletionRing();
          if (!isBreak) {
            setCompletedFocusSessions((prev) => prev + 1);
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

  useEffect(() => {
    persistState({ isRunning, isBreak, timeLeft, completedFocusSessions });
  }, [isRunning, isBreak, timeLeft, completedFocusSessions, persistState]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_SECONDS : WORK_SECONDS);
  }, [isBreak]);

  const resetFocusScore = useCallback(() => {
    if (authSessionKey) {
      skipHydrationSessionRef.current = authSessionKey;
    }
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_SECONDS);
    setCompletedFocusSessions(0);
    if (stopAlarmTimeoutRef.current) {
      window.clearTimeout(stopAlarmTimeoutRef.current);
      stopAlarmTimeoutRef.current = null;
    }
    if (completionAudioRef.current) {
      completionAudioRef.current.pause();
      completionAudioRef.current.currentTime = 0;
    }
  }, [authSessionKey]);

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
      resetFocusScore,
      switchMode,
      timeLeft,
      toggleRunning,
    }),
    [completedFocusSessions, isBreak, isRunning, resetTimer, resetFocusScore, switchMode, timeLeft, toggleRunning],
  );
}
