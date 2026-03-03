const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../constants/serverConfig");
const { getTokenFromRequest } = require("../utils/cookieUtils");

function authOptional(req, _res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    req.userId = null;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
  } catch {
    req.userId = null;
  }

  next();
}

function authRequired(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = {
  authOptional,
  authRequired,
};
