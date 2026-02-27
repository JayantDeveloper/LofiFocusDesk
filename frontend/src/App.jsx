import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { FocusStatsCard } from "./components/FocusStatsCard";
import GoogleCalendar from "./components/GoogleCalendar";
import { FocusRoomHud } from "./components/FocusRoomHud";
import { FocusRoomPopup } from "./components/FocusRoomPopup";
import { RoomMusicPlayer } from "./components/RoomMusicPlayer";
import { FocusTodoBoardApp } from "./focus-room/todo-board/FocusTodoBoardApp";
import { useBoardPomodoroState } from "./focus-room/todo-board/hooks/useBoardPomodoroState";
import { useBoardTodoItems } from "./focus-room/todo-board/hooks/useBoardTodoItems";
import { WelcomeOverlay } from "./components/WelcomeOverlay";
import { AuthModal } from "./components/AuthModal";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { SettingsButton } from "./components/SettingsButton";
import { useAuth } from "./auth/AuthContext";
import { normalizeMusicUrls } from "./utils/music";
import "./App.css";

const DAY_ICON_PATH = "/lofideskiconday.png";
const NIGHT_ICON_PATH = "/lofideskiconnight.png";
const POMODORO_WORK_SECONDS = 25 * 60;
const FocusRoomExperience = lazy(() => import("./focus-room/FocusRoomExperience"));

function getInitialClockDisplay() {
  const now = new Date();
  const hour24 = now.getHours();
  const hour12 = hour24 % 12 || 12;
  const minute = now.getMinutes();
  return {
    ampm: hour24 >= 12 ? "PM" : "AM",
    hour24,
    time: `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function App() {
  const [isBoardPopupOpen, setIsBoardPopupOpen] = useState(false);
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [isStatsCardOpen, setIsStatsCardOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [activeMusicSlot, setActiveMusicSlot] = useState(0);
  const musicPrevRef = useRef(false);
  const lastAuthEventRef = useRef(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [worldClockDisplay, setWorldClockDisplay] = useState(() => getInitialClockDisplay());
  const { user, loading: authLoading, hasSessionHint, authEventId } = useAuth();
  const showAuthModal = !user && (!authLoading || !hasSessionHint);
  const isAuthGateOpen = !user;
  const calendarEmbed = user?.calendar_embed || undefined;
  const musicUrls = normalizeMusicUrls(user?.music_urls);
  const activeMusicUrl = musicUrls[activeMusicSlot] || musicUrls[0];
  const isCameraLocked = isBoardPopupOpen || isCalendarPopupOpen || !user || isSettingsOpen;
  // Keep interactions off while auth/settings/popups are active.
  const sceneInteractable = !isAuthGateOpen && !isSettingsOpen && !isBoardPopupOpen && !isCalendarPopupOpen && !isStatsCardOpen;
  const hotkeysEnabled = !isAuthGateOpen && !isSettingsOpen;
  const boardPomodoro = useBoardPomodoroState();
  const boardTodo = useBoardTodoItems();
  const todoItems = boardTodo.items;
  const completedTasks = Math.max(0, boardTodo.doneDeletedTasks ?? 0);
  const totalTasks = Math.max(completedTasks, boardTodo.totalCreatedTasks ?? todoItems.length);
  const taskScore =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;
  const completedFocusSessions = boardPomodoro.completedFocusSessions ?? 0;
  const focusProgress = boardPomodoro.isBreak
    ? 1
    : Math.max(
        0,
        Math.min(1, (POMODORO_WORK_SECONDS - boardPomodoro.timeLeft) / POMODORO_WORK_SECONDS),
      );
  const focusScore = Math.min(
    100,
    Math.round(completedFocusSessions * 18 + focusProgress * 12 + (boardPomodoro.isRunning ? 4 : 0)),
  );
  const resetScores = useCallback(() => {
    boardPomodoro.resetFocusScore?.();
    boardTodo.resetTaskScore?.();
  }, [boardPomodoro, boardTodo]);
  const toggleMusic = useCallback(() => setIsMusicPlaying((prev) => !prev), []);
  const selectMusicSlot = useCallback((slot) => {
    const slotNumber = Number(slot);
    if (!Number.isInteger(slotNumber)) return;
    const nextSlot = Math.min(4, Math.max(0, slotNumber));
    setActiveMusicSlot(nextSlot);
  }, []);
  const handlePauseMusic = useCallback(() => {
    musicPrevRef.current = isMusicPlaying;
    setIsMusicPlaying(false);
  }, [isMusicPlaying]);
  const handleResumeMusic = useCallback(() => {
    setIsMusicPlaying(musicPrevRef.current);
  }, []);
  const openBoardPopup = useCallback(() => {
    setIsStatsCardOpen(false);
    setIsCalendarPopupOpen(false);
    setIsBoardPopupOpen(true);
  }, []);
  const openCalendarPopup = useCallback(() => {
    setIsStatsCardOpen(false);
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(true);
  }, []);
  const openStatsCard = useCallback(() => {
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(false);
    setIsStatsCardOpen(true);
  }, []);
  const toggleStatsCard = useCallback(() => {
    setIsStatsCardOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsBoardPopupOpen(false);
        setIsCalendarPopupOpen(false);
      }
      return next;
    });
  }, []);
  const toggleBoardPopup = useCallback(() => {
    setIsBoardPopupOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsCalendarPopupOpen(false);
        setIsStatsCardOpen(false);
      }
      return next;
    });
  }, []);
  const toggleCalendarPopup = useCallback(() => {
    setIsCalendarPopupOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsBoardPopupOpen(false);
        setIsStatsCardOpen(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      lastAuthEventRef.current = authEventId;
      return;
    }
    if (lastAuthEventRef.current === authEventId) {
      return;
    }

    lastAuthEventRef.current = authEventId;
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(false);
    setIsStatsCardOpen(false);
    setIsSettingsOpen(false);
    setIsMusicPlaying(false);
    setActiveMusicSlot(0);
    musicPrevRef.current = false;
    boardPomodoro.resetFocusScore?.();
  }, [authEventId, boardPomodoro.resetFocusScore, user]);

  useEffect(() => {
    if (user) return;
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(false);
    setIsStatsCardOpen(false);
    setIsSettingsOpen(false);
    setIsMusicPlaying(false);
    musicPrevRef.current = false;
  }, [user]);

  useEffect(() => {
    const isDay = worldClockDisplay.hour24 >= 6 && worldClockDisplay.hour24 < 18;
    const iconHref = isDay ? DAY_ICON_PATH : NIGHT_ICON_PATH;
    let favicon = document.querySelector("#app-favicon");
    if (!favicon) {
      favicon = document.querySelector("link[rel='icon']");
    }
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      document.head.appendChild(favicon);
    }
    favicon.setAttribute("id", "app-favicon");
    favicon.setAttribute("type", "image/png");
    favicon.setAttribute("href", iconHref);
    document.title = `LofiFocusDesk - (${worldClockDisplay.time} ${worldClockDisplay.ampm})`;
  }, [worldClockDisplay]);

  return (
    <div className="focus-room-app">
      <WelcomeOverlay />
      {showAuthModal ? <AuthModal /> : null}
      {user ? <SettingsButton onClick={() => setIsSettingsOpen(true)} /> : null}
      {user ? (
        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            setIsMusicPlaying(musicPrevRef.current);
          }}
          onPauseMusic={handlePauseMusic}
          onResumeMusic={handleResumeMusic}
        />
      ) : null}
      {sceneInteractable ? <FocusRoomHud /> : null}
      {user ? (
        <Suspense fallback={null}>
          <FocusRoomExperience
            boardPomodoro={boardPomodoro}
            boardTodo={boardTodo}
            isCameraLocked={isCameraLocked}
            hotkeysEnabled={hotkeysEnabled}
            isInteractable={sceneInteractable}
            isMusicPlaying={isMusicPlaying}
            onOpenCalendarPopup={openCalendarPopup}
            onOpenBoardPopup={openBoardPopup}
            onOpenStatsPopup={openStatsCard}
            onToggleBoardPopup={toggleBoardPopup}
            onToggleCalendarPopup={toggleCalendarPopup}
            onToggleStatsPopup={toggleStatsCard}
            focusScore={focusScore}
            taskScore={taskScore}
            onWorldClockDisplayChange={setWorldClockDisplay}
            onToggleMusic={toggleMusic}
            onSelectMusicSlot={selectMusicSlot}
          />
        </Suspense>
      ) : null}

      {user ? (
        <FocusRoomPopup isOpen={isBoardPopupOpen} onClose={() => setIsBoardPopupOpen(false)}>
          <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
        </FocusRoomPopup>
      ) : null}

      {user ? (
        <FocusRoomPopup
          contentClassName="focus-calendar-popup-content"
          isOpen={isCalendarPopupOpen}
          onClose={() => setIsCalendarPopupOpen(false)}
        >
          <GoogleCalendar embedUrl={calendarEmbed} />
        </FocusRoomPopup>
      ) : null}

      {user ? (
        <FocusStatsCard
          completedFocusSessions={completedFocusSessions}
          completedTasks={completedTasks}
          focusScore={focusScore}
          isOpen={isStatsCardOpen}
          onClose={() => setIsStatsCardOpen(false)}
          onResetScores={resetScores}
          taskScore={taskScore}
          totalTasks={totalTasks}
        />
      ) : null}

      {user && isMusicPlaying && !isSettingsOpen ? (
        <RoomMusicPlayer isPlaying={isMusicPlaying} sourceUrl={activeMusicUrl} />
      ) : null}
    </div>
  );
}

export default App;
