function formatScore(score) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  return Math.round(clamped);
}

function ScoreRing({ score, ringColor, trackColor }) {
  const value = formatScore(score);
  const angle = value * 3.6;
  return (
    <div
      className="focus-stats-ring"
      style={{
        background: `conic-gradient(${ringColor} ${angle}deg, ${trackColor} ${angle}deg)`,
      }}
      role="img"
      aria-label={`${value} out of 100`}
    >
      <span>{value}</span>
    </div>
  );
}

export function FocusStatsCard({
  completedFocusSessions,
  completedTasks,
  earnedTokens,
  focusScore,
  isOpen,
  onClose,
  onResetScores,
  taskScore,
  totalTasks,
}) {
  const safeCompletedTasks = Math.max(0, Number.isFinite(completedTasks) ? completedTasks : 0);
  const safeTotalTasks = Math.max(0, Number.isFinite(totalTasks) ? totalTasks : 0);
  const safeCompletedSessions = Math.max(
    0,
    Number.isFinite(completedFocusSessions) ? completedFocusSessions : 0,
  );
  const safeEarnedTokens = Math.max(0, Number.isFinite(earnedTokens) ? earnedTokens : 0);
  const cardClassName = `focus-stats-card ${isOpen ? "is-open" : "is-closed"}`;

  return (
    <section aria-hidden={!isOpen} className={cardClassName}>
      <div className="focus-stats-card-header">
        <h2>Session Stats</h2>
        <div className="focus-stats-card-header-actions">
          <button onClick={onResetScores} type="button">
            Reset
          </button>
          <button onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>

      <div className="focus-stats-grid">
        <article className="focus-stats-tile focus-score">
          <ScoreRing
            score={focusScore}
            ringColor="#5f87b8"
            trackColor="rgba(255, 255, 255, 0.55)"
          />
          <h3>Focus</h3>
          <span>
            {safeCompletedSessions} session{safeCompletedSessions === 1 ? "" : "s"} done
          </span>
        </article>

        <article className="focus-stats-tile task-score">
          <ScoreRing
            score={taskScore}
            ringColor="#6f9a55"
            trackColor="rgba(255, 255, 255, 0.55)"
          />
          <h3>Tasks</h3>
          <span>
            {safeCompletedTasks}/{safeTotalTasks} cleared
          </span>
        </article>

        <article className="focus-stats-tile tokens-earned">
          <div className="focus-stats-token">
            <span className="focus-stats-token-star" aria-hidden="true">
              ✨
            </span>
            <span className="focus-stats-token-value">{safeEarnedTokens}</span>
          </div>
          <h3>Tokens</h3>
          <span>from finished tasks</span>
        </article>
      </div>
    </section>
  );
}
