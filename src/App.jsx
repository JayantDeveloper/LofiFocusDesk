import { useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import GoogleCalendar from "./components/GoogleCalendar";
import { RoomMusicPlayer } from "./components/RoomMusicPlayer";
import { FocusTodoBoardApp } from "./focus-room/todo-board/FocusTodoBoardApp";
import { FocusRoomScene } from "./focus-room/FocusRoomScene";
import { useBoardPomodoroState } from "./focus-room/todo-board/hooks/useBoardPomodoroState";
import { useBoardTodoItems } from "./focus-room/todo-board/hooks/useBoardTodoItems";
import { WelcomeOverlay } from "./components/WelcomeOverlay";
import "./App.css";

function App() {
  const [isBoardPopupOpen, setIsBoardPopupOpen] = useState(false);
  const [isCalendarPopupOpen, setIsCalendarPopupOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const isCameraLocked = isBoardPopupOpen || isCalendarPopupOpen;
  const boardPomodoro = useBoardPomodoroState();
  const boardTodo = useBoardTodoItems();
  const toggleMusic = useCallback(() => setIsMusicPlaying((prev) => !prev), []);
  const openBoardPopup = useCallback(() => {
    setIsCalendarPopupOpen(false);
    setIsBoardPopupOpen(true);
  }, []);
  const openCalendarPopup = useCallback(() => {
    setIsBoardPopupOpen(false);
    setIsCalendarPopupOpen(true);
  }, []);
  const toggleBoardPopup = useCallback(() => setIsBoardPopupOpen((prev) => !prev), []);
  const toggleCalendarPopup = useCallback(() => {
    setIsCalendarPopupOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsBoardPopupOpen(false);
      }
      return next;
    });
  }, []);

  return (
    <div className="focus-room-app">
      <WelcomeOverlay />
      <div className="focus-room-hud" aria-live="polite">
        <p className="focus-room-title">Binds</p>
        <p className="focus-room-hint">T - Todo List / Plant</p>
        <p className="focus-room-hint">C - Calendar / Wall Calendar</p>
        <p className="focus-room-hint">R - Music / Radio</p>
      </div>
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
          onToggleBoardPopup={toggleBoardPopup}
          onToggleCalendarPopup={toggleCalendarPopup}
          onToggleMusic={toggleMusic}
        />
      </Canvas>

      <div
        aria-hidden={!isBoardPopupOpen}
        className={`focus-board-popup-backdrop ${isBoardPopupOpen ? "is-open" : "is-closed"}`}
        onClick={() => setIsBoardPopupOpen(false)}
      >
        <div className="focus-board-popup-panel" onClick={(event) => event.stopPropagation()}>
          <button
            className="focus-board-popup-close"
            onClick={() => setIsBoardPopupOpen(false)}
            type="button"
          >
            Close
          </button>
          <div className="focus-board-popup-content">
            <FocusTodoBoardApp boardPomodoro={boardPomodoro} boardTodo={boardTodo} />
          </div>
        </div>
      </div>

      <div
        aria-hidden={!isCalendarPopupOpen}
        className={`focus-board-popup-backdrop ${isCalendarPopupOpen ? "is-open" : "is-closed"}`}
        onClick={() => setIsCalendarPopupOpen(false)}
      >
        <div className="focus-board-popup-panel" onClick={(event) => event.stopPropagation()}>
          <button
            className="focus-board-popup-close"
            onClick={() => setIsCalendarPopupOpen(false)}
            type="button"
          >
            Close
          </button>
          <div className="focus-board-popup-content focus-calendar-popup-content">
            <GoogleCalendar />
          </div>
        </div>
      </div>

      <RoomMusicPlayer isPlaying={isMusicPlaying} />
    </div>
  );
}

export default App;
