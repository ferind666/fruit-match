const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fruit-match-secret-change-in-production';
const JWT_EXPIRES = '7d';

/** Sign a token for the given user id */
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** Express middleware — rejects unauthenticated requests */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = { signToken, requireAuth };