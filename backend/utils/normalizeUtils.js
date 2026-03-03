function normalizeUsername(value) {
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  normalizeUsername,
};
