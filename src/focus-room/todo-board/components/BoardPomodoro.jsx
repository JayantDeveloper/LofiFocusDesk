import { useBoardPomodoroState } from "../hooks/useBoardPomodoroState";

export function BoardPomodoro({ pomodoro }) {
  const localPomodoro = useBoardPomodoroState();
  const resolvedPomodoro = pomodoro ?? localPomodoro;
  const { isBreak, isRunning, resetTimer, switchMode, timeLeft, toggleRunning } = resolvedPomodoro;

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className={`focus-board-pomodoro ${isBreak ? "break-mode" : "focus-mode"}`}>
      <div className="focus-board-pomodoro-modes">
        <button
          className={`focus-board-mode-button ${!isBreak ? "active" : ""}`}
          onClick={() => switchMode(false)}
        >
          Focus
        </button>
        <button
          className={`focus-board-mode-button ${isBreak ? "active" : ""}`}
          onClick={() => switchMode(true)}
        >
          Break
        </button>
      </div>

      <div className="focus-board-pomodoro-time">
        {minutes} : {seconds}
      </div>

      <div className="focus-board-pomodoro-controls">
        <button className="focus-board-pomodoro-button" onClick={toggleRunning}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button className="focus-board-pomodoro-button" onClick={resetTimer}>
          Reset
        </button>
      </div>
    </div>
  );
}
