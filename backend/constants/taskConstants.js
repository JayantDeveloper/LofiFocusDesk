const TODO_DIFFICULTY_OPTIONS = Object.freeze(["Easy", "Medium", "Hard", "Very Hard"]);
const TODO_STATUS_OPTIONS = Object.freeze(["Not Started", "In Progress", "Done"]);

// Token reward per completed task. Must match DIFFICULTY_XP in
// frontend/src/constants/todoBoardConstants.js.
const DIFFICULTY_XP = Object.freeze({
  "Very Hard": 100,
  "Hard": 60,
  "Medium": 40,
  "Easy": 25,
});

module.exports = {
  DIFFICULTY_XP,
  TODO_DIFFICULTY_OPTIONS,
  TODO_STATUS_OPTIONS,
};
