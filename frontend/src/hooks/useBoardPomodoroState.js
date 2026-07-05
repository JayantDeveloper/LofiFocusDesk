import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import completionAlarmSrc from "../assets/freesound_community-alarm-clock-short-6402.mp3";
import {
  BREAK_SECONDS,
  COMPLETION_ALARM_PREVIEW_MS,
  WORK_SECONDS,
} from "../constants/pomodoroConstants";
import { apiRequest } from "../utils/apiClient";
import { useAuth } from "../store/AuthStore";
import { useStartupData } from "../store/StartupDataStore";

const PERSIST_INTERVAL_MS = 10_000;

export function useBoardPomodoroState() {
  const { user } = useAuth();
  const { data: startupData, ready: startupReady } = useStartupData();
  const authSessionKey = user ? `${user.id ?? user.username ?? "user"}` : "";
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);
  const completionAudioRef = useRef(null);
  const stopAlarmTimeoutRef = useRef(null);
  const skipHydrationSessionRef = useRef("");
  const prevPersistedRef = useRef(null);
  const lastPersistAtRef = useRef(0);

  useEffect(() => {
    if (!authSessionKey) {
      skipHydrationSessionRef.current = "";
    }
  }, [authSessionKey]);

  useEffect(() => {
    if (!authSessionKey) return;
    if (user && !startupReady) return; // wait for startup fetch before loading
    let isMounted = true;
    async function load() {
      if (!user) return;
      setIsHydrating(true);
      try {
        const raw = startupData ?? await apiRequest("/api/pomodoro");
        if (skipHydrationSessionRef.current === authSessionKey) return;
        const state = (startupData ? raw.pomodoro?.state : raw.state) || {};
        setIsRunning(state.isRunning ?? false);
        setIsBreak(state.isBreak ?? false);
        setTimeLeft(state.timeLeft ?? WORK_SECONDS);
        setCompletedFocusSessions(state.completedFocusSessions ?? 0);
      } catch {
        return;
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [authSessionKey, user, startupReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authSessionKey) {
      setIsHydrating(true);
      setIsRunning(false);
      setIsBreak(false);
      setTimeLeft(WORK_SECONDS);
      setCompletedFocusSessions(0);
    }
  }, [authSessionKey]);

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
      } catch {
        return;
      }
    },
    [user],
  );

  const playCompletionRing = useCallback(() => {
    if (!completionAudioRef.current) {
      const audio = new Audio(completionAlarmSrc);
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
    if (isHydrating) return;
    const prev = prevPersistedRef.current;
    prevPersistedRef.current = { isRunning, isBreak, timeLeft, completedFocusSessions };
    // While running, timeLeft ticks every second — throttle those PUTs.
    // Anything else (start/pause/reset/mode switch/session complete) flushes immediately.
    const onlyTickChanged =
      prev !== null &&
      isRunning &&
      prev.isRunning === isRunning &&
      prev.isBreak === isBreak &&
      prev.completedFocusSessions === completedFocusSessions &&
      prev.timeLeft !== timeLeft;
    if (onlyTickChanged && Date.now() - lastPersistAtRef.current < PERSIST_INTERVAL_MS) {
      return;
    }
    lastPersistAtRef.current = Date.now();
    persistState({ isRunning, isBreak, timeLeft, completedFocusSessions });
  }, [isRunning, isBreak, timeLeft, completedFocusSessions, isHydrating, persistState]);

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
      isHydrating,
      isReady: !isHydrating,
      resetTimer,
      resetFocusScore,
      switchMode,
      timeLeft,
      toggleRunning,
    }),
    [completedFocusSessions, isBreak, isHydrating, isRunning, resetTimer, resetFocusScore, switchMode, timeLeft, toggleRunning],
  );
}
