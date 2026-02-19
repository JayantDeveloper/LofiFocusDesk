import { useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { FocusStatsCard } from "./components/FocusStatsCard";
import GoogleCalendar from "./components/GoogleCalendar";
import { FocusRoomHud } from "./components/FocusRoomHud";
import { FocusRoomPopup } from "./components/FocusRoomPopup";
import { RoomMusicPlayer } from "./components/RoomMusicPlayer";
import { FocusTodoBoardApp } from "./focus-room/todo-board/FocusTodoBoardApp";
import { FocusRoomScene } from "./focus-room/FocusRoomScene";
import { useBoardPomodoroState } from "./focus-room/todo-board/hooks/useBoardPomodoroState";
import { useBoardTodoItems } from "./focus-room/todo-board/hooks/useBoardTodoItems";
import { WelcomeOverlay } from "./components/WelcomeOverlay";
import "./App.css";

const DAY_ICON_PATH = "/lofideskiconday.png";
const NIGHT_ICON_PATH = "/lofideskiconnight.png";
const POMODORO_WORK_SECONDS = 25 * 60;

function getInitialClockDisplay() {
  const now = new Date();
  const hour24 = now.getHours();
  const hour12 = hour24 % 12 || 12;
  return {
    ampm: hour24 >= 12 ? "PM" : "AM",
    hour24,
    time: `${String(hour12).padStart(2, "0")}:00`,
  };
}

function App() {
  const [isBoardPopupOpen, setIsBoardPopupOpen] = useState(false);
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [isStatsCardOpen, setIsStatsCardOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [worldClockDisplay, setWorldClockDisplay] = useState(() => getInitialClockDisplay());
  const isCameraLocked = isBoardPopupOpen || isCalendarPopupOpen;
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
      <FocusRoomHud />
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [-2.02, 1.42, -0.79],
          fov: 46,
          near: 0.1,
          far: 50,
        }}
      >
        <FocusRoomScene
          boardPomodoro={boardPomodoro}
          boardTodo={boardTodo}
          isCameraLocked={isCameraLocked}
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
        />
      </Canvas>

      <FocusRoomPopup isOpen={isBoardPopupOpen} onClose={() => setIsBoardPopupOpen(false)}>
        <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
      </FocusRoomPopup>

      <FocusRoomPopup
        contentClassName="focus-calendar-popup-content"
        isOpen={isCalendarPopupOpen}
        onClose={() => setIsCalendarPopupOpen(false)}
      >
        <GoogleCalendar />
      </FocusRoomPopup>

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

      <RoomMusicPlayer isPlaying={isMusicPlaying} />
    </div>
  );
}

export default App;
