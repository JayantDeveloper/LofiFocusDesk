function formatScore(score) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  return Math.round(clamped);
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
            Reset Scores
          </button>
          <button onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>

      <div className="focus-stats-grid">
        <article className="focus-stats-tile focus-score">
          <h3>Focus Score</h3>
          <p>{formatScore(focusScore)}</p>
          <span>{safeCompletedSessions} focus sessions completed</span>
        </article>

        <article className="focus-stats-tile task-score">
          <h3>Task Score</h3>
          <p>{formatScore(taskScore)}</p>
          <span>
            {safeCompletedTasks}/{safeTotalTasks} tasks cleared via Done
          </span>
        </article>

        <article className="focus-stats-tile tokens-earned">
          <h3>Tokens Earned</h3>
          <p>{safeEarnedTokens}</p>
          <span>pts from completed tasks</span>
        </article>
      </div>
    </section>
  );
}
