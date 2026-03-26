import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { FocusStatsCard } from "./components/FocusStatsCard";
import GoogleCalendar from "./components/GoogleCalendar";
import { FocusRoomHud } from "./components/FocusRoomHud";
import { FocusRoomPopup } from "./components/FocusRoomPopup";
import CurrentlyPlaying from "./components/CurrentlyPlaying";
import { RoomMusicPlayer } from "./components/RoomMusicPlayer";
import { FocusTodoBoardApp } from "./scenes/focusRoom/todo-board/FocusTodoBoardApp";
import { useBoardPomodoroState } from "./hooks/useBoardPomodoroState";
import { useBoardTodoItems } from "./hooks/useBoardTodoItems";
import { WelcomeOverlay } from "./components/WelcomeOverlay";
import { AuthModal } from "./components/AuthModal";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { SettingsButton } from "./components/SettingsButton";
import dayIcon from "./assets/lofideskiconday.png";
import nightIcon from "./assets/lofideskiconnight.png";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  DEFAULT_SYNC_BREAK_SLOT,
  DEFAULT_SYNC_FOCUS_SLOT,
} from "./constants/appConstants";
import { MAX_MUSIC_SLOTS } from "./constants/musicConstants";
import { WORK_SECONDS } from "./constants/pomodoroConstants";
import { useAuth } from "./store/AuthStore";
import {
  extractYouTubeVideoId,
  fetchYouTubeVideoMetadata,
  normalizeMusicUrls,
} from "./utils/music";
import "./App.css";

const loadFocusRoomExperience = () => import("./scenes/focusRoom/FocusRoomExperience");
const FocusRoomExperience = lazy(loadFocusRoomExperience);

function clampMusicSlot(value, fallback = DEFAULT_SYNC_FOCUS_SLOT) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(0, Math.min(MAX_MUSIC_SLOTS - 1, parsed));
}

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
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  const [isBoardPopupOpen, setIsBoardPopupOpen] = useState(false);
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [isStatsCardOpen, setIsStatsCardOpen] = useState(false);
  const [isSceneModuleLoaded, setIsSceneModuleLoaded] = useState(false);
  const [sceneReadySessionId, setSceneReadySessionId] = useState(0);
  const [isRadioOn, setIsRadioOn] = useState(false);
  const [isMusicPaused, setIsMusicPaused] = useState(false);
  const [activeMusicSlot, setActiveMusicSlot] = useState(0);
  const [trackMetadataByVideoId, setTrackMetadataByVideoId] = useState({});
  const lastAuthEventRef = useRef(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthScreenOpen, setIsAuthScreenOpen] = useState(true);
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [worldClockDisplay, setWorldClockDisplay] = useState(() => getInitialClockDisplay());
  const { user, authEventId, loading, isAuthenticating } = useAuth();
  const sceneSessionId = user ? authEventId : 0;
  const isAuthStateLoading = loading || isAuthenticating;
  const showAuthModal = isAuthScreenOpen;
  const showAuthLoading = isAuthScreenOpen && isAuthStateLoading;
  const shouldRenderScene = isWelcomeComplete && Boolean(user) && !isAuthScreenOpen;
  const shouldRenderSceneShell = isSceneModuleLoaded && shouldRenderScene;
  const boardPomodoro = useBoardPomodoroState();
  const boardTodo = useBoardTodoItems();
  const isSceneDataReady = user ? boardPomodoro.isReady && boardTodo.isReady : true;
  const isSceneCanvasReady = sceneReadySessionId === sceneSessionId;
  const isSceneReady = isSceneModuleLoaded && isSceneCanvasReady && isSceneDataReady;
  const isSceneLoading = shouldRenderScene && !isSceneReady;
  const calendarEmbed = user?.calendar_embed || undefined;
  const musicUrls = normalizeMusicUrls(user?.music_urls);
  const radioSyncEnabled = user?.radio_sync_enabled === true;
  const focusSyncSlot = clampMusicSlot(user?.radio_focus_slot, DEFAULT_SYNC_FOCUS_SLOT);
  const breakSyncSlot = clampMusicSlot(user?.radio_break_slot, DEFAULT_SYNC_BREAK_SLOT);
  const activeMusicUrl = musicUrls[activeMusicSlot] || "";
  const activeMusicVideoId = extractYouTubeVideoId(activeMusicUrl);
  const activeTrackMetadata = activeMusicVideoId ? trackMetadataByVideoId[activeMusicVideoId] : null;
  const isMusicPlaying = isRadioOn && !isMusicPaused;
  const currentTrackTitle = activeMusicVideoId
    ? (activeTrackMetadata?.title || "Loading title...")
    : `No track in slot ${activeMusicSlot + 1}`;
  const currentTrackArtist = activeMusicVideoId
    ? (activeTrackMetadata?.channelName || "Loading channel...")
    : "Add a valid YouTube URL in Settings";
  const isSceneVisible = shouldRenderScene && isSceneReady;
  const isCameraLocked =
    isBoardPopupOpen || isCalendarPopupOpen || !user || isAuthScreenOpen || isSettingsOpen;
  const isFullscreenUiOpen = isBoardPopupOpen || isCalendarPopupOpen;
  const showCurrentlyPlaying = user && isRadioOn && !isFullscreenUiOpen;
  const shouldRenderMusicPlayer = user && isRadioOn;
  // Keep interactions off while auth/settings/popups are active.
  const sceneInteractable =
    isSceneReady &&
    !isAuthScreenOpen &&
    !isSettingsOpen &&
    !isBoardPopupOpen &&
    !isCalendarPopupOpen &&
    !isStatsCardOpen;
  const hotkeysEnabled = isSceneReady && !isAuthScreenOpen && !isSettingsOpen;
  const todoItems = boardTodo.items;
  const earnedTokens = boardTodo.earnedTokens ?? 0;
  const completedTasks = Math.max(0, boardTodo.doneDeletedTasks ?? 0);
  const totalTasks = Math.max(0, Number.isFinite(boardTodo.totalCreatedTasks) ? boardTodo.totalCreatedTasks : todoItems.length);
  const taskScore =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;
  const completedFocusSessions = boardPomodoro.completedFocusSessions ?? 0;
  const focusProgress = boardPomodoro.isBreak
    ? 1
    : Math.max(
        0,
        Math.min(1, (WORK_SECONDS - boardPomodoro.timeLeft) / WORK_SECONDS),
      );
  const focusScore = Math.min(
    100,
    Math.round(completedFocusSessions * 18 + focusProgress * 12 + (boardPomodoro.isRunning ? 4 : 0)),
  );
  const resetScores = useCallback(() => {
    boardPomodoro.resetFocusScore?.();
    boardTodo.resetTaskScore?.();
  }, [boardPomodoro, boardTodo]);
  const toggleMusic = useCallback(() => {
    setIsRadioOn((prev) => {
      const next = !prev;
      if (next) {
        setIsMusicPaused(false);
      }
      return next;
    });
  }, []);
  const togglePauseMusic = useCallback(() => {
    if (!isRadioOn) return;
    setIsMusicPaused((prev) => !prev);
  }, [isRadioOn]);
  const selectMusicSlot = useCallback((slot) => {
    const slotNumber = Number(slot);
    if (!Number.isInteger(slotNumber)) return;
    const nextSlot = Math.min(MAX_MUSIC_SLOTS - 1, Math.max(0, slotNumber));
    setActiveMusicSlot(nextSlot);
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
  const handleSceneReady = useCallback(() => {
    setSceneReadySessionId(sceneSessionId);
  }, [sceneSessionId]);

  useEffect(() => {
    if (!isWelcomeComplete) return;
    if (!user && !isAuthStateLoading) {
      setIsAuthScreenOpen(true);
    }
  }, [isWelcomeComplete, isAuthStateLoading, user]);

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
    setIsRadioOn(false);
    setIsMusicPaused(false);
    setActiveMusicSlot(0);
    boardPomodoro.resetFocusScore?.();
  }, [authEventId, boardPomodoro.resetFocusScore, user]);

  useEffect(() => {
    if (user) return;
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(false);
    setIsStatsCardOpen(false);
    setIsSettingsOpen(false);
    setIsRadioOn(false);
    setIsMusicPaused(false);
  }, [user]);

  useEffect(() => {
    let isCancelled = false;
    loadFocusRoomExperience()
      .then(() => {
        if (isCancelled) return;
        setIsSceneModuleLoaded(true);
      })
      .catch(() => {
        if (isCancelled) return;
        setIsSceneModuleLoaded(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeMusicVideoId) return;
    if (trackMetadataByVideoId[activeMusicVideoId]) return;

    const controller = new AbortController();
    fetchYouTubeVideoMetadata(activeMusicVideoId, { signal: controller.signal })
      .then((metadata) => {
        const fallbackMetadata = {
          title: `Song ${activeMusicSlot + 1}`,
          channelName: "Unknown channel",
        };
        setTrackMetadataByVideoId((prev) => {
          if (prev[activeMusicVideoId]) return prev;
          return {
            ...prev,
            [activeMusicVideoId]: metadata || fallbackMetadata,
          };
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTrackMetadataByVideoId((prev) => {
          if (prev[activeMusicVideoId]) return prev;
          return {
            ...prev,
            [activeMusicVideoId]: {
              title: `Song ${activeMusicSlot + 1}`,
              channelName: "Unknown channel",
            },
          };
        });
      });

    return () => {
      controller.abort();
    };
  }, [activeMusicVideoId, activeMusicSlot, trackMetadataByVideoId]);

  useEffect(() => {
    if (!user || !radioSyncEnabled || !isRadioOn || !boardPomodoro.isRunning) return;
    const targetSlot = boardPomodoro.isBreak ? breakSyncSlot : focusSyncSlot;
    setActiveMusicSlot((currentSlot) => (currentSlot === targetSlot ? currentSlot : targetSlot));
  }, [
    user,
    radioSyncEnabled,
    isRadioOn,
    boardPomodoro.isRunning,
    boardPomodoro.isBreak,
    focusSyncSlot,
    breakSyncSlot,
  ]);

  useEffect(() => {
    const isDay = worldClockDisplay.hour24 >= DAY_START_HOUR && worldClockDisplay.hour24 < DAY_END_HOUR;
    const iconHref = isDay ? dayIcon : nightIcon;
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
    <div
      className={`focus-room-app${
        showAuthModal || showAuthLoading || isSceneLoading ? " auth-stage" : ""
      }`}
    >
      {!isWelcomeComplete ? (
        <WelcomeOverlay
          canDismiss
          onComplete={() => {
            setIsWelcomeComplete(true);
          }}
        />
      ) : null}
      <div className="focus-room-auth-layer">
        {(showAuthLoading || isSceneLoading) ? (
          <div className="focus-room-auth-veil">
            {isSceneLoading ? "Loading room assets..." : "Preparing your workspace..."}
          </div>
        ) : null}
        {showAuthModal ? <AuthModal onAuthed={() => setIsAuthScreenOpen(false)} /> : null}
      </div>
      {user && !isAuthScreenOpen && !isBoardPopupOpen && !isCalendarPopupOpen ? (
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      ) : null}
      {user && !isAuthScreenOpen ? (
        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
          }}
        />
      ) : null}

      {shouldRenderSceneShell ? (
        <div className={`focus-room-scene-shell ${isSceneVisible ? "is-visible" : ""}`}>
          <Suspense fallback={null}>
            <FocusRoomExperience
              boardPomodoro={boardPomodoro}
              boardTodo={boardTodo}
              sceneSession={sceneSessionId}
              isCameraLocked={isCameraLocked}
              hotkeysEnabled={hotkeysEnabled}
              isInteractable={sceneInteractable}
              isMusicPlaying={isRadioOn}
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
              onSceneReady={handleSceneReady}
            />
          </Suspense>
        </div>
      ) : null}

      {isSceneReady && !isAuthScreenOpen && !isSettingsOpen && !isBoardPopupOpen && !isCalendarPopupOpen ? (
        <FocusRoomHud
          isCollapsed={isHudCollapsed}
          onCollapsedChange={setIsHudCollapsed}
        />
      ) : null}

      {user && !isAuthScreenOpen ? (
        <FocusRoomPopup isOpen={isBoardPopupOpen} onClose={() => setIsBoardPopupOpen(false)}>
          <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
        </FocusRoomPopup>
      ) : null}

      {user && !isAuthScreenOpen ? (
        <FocusRoomPopup
          contentClassName="focus-calendar-popup-content"
          isOpen={isCalendarPopupOpen}
          onClose={() => setIsCalendarPopupOpen(false)}
        >
          <GoogleCalendar embedUrl={calendarEmbed} />
        </FocusRoomPopup>
      ) : null}

      {user && !isAuthScreenOpen ? (
        <FocusStatsCard
          completedFocusSessions={completedFocusSessions}
          completedTasks={completedTasks}
          earnedTokens={earnedTokens}
          focusScore={focusScore}
          isOpen={isStatsCardOpen}
          onClose={() => setIsStatsCardOpen(false)}
          onResetScores={resetScores}
          taskScore={taskScore}
          totalTasks={totalTasks}
        />
      ) : null}

      {user && !isAuthScreenOpen && showCurrentlyPlaying ? (
        <div className="currently-playing-shell">
          <CurrentlyPlaying
            artist={currentTrackArtist}
            onTogglePlay={togglePauseMusic}
            playing={isMusicPlaying}
            title={currentTrackTitle}
          />
        </div>
      ) : null}

      {user && !isAuthScreenOpen && shouldRenderMusicPlayer ? (
        <RoomMusicPlayer isPlaying={isMusicPlaying} sourceUrl={activeMusicUrl} />
      ) : null}
    </div>
  );
}

export default App;
