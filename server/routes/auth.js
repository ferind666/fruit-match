const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { getDb, saveToDisk } = require('../db');
const { signToken } = require('../middleware/auth');

const router = Router();

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 20) {
    return res.status(400).json({ error: '用户名需 2-20 个字符' });
  }
  if (typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: '密码至少 4 位' });
  }

  const db = await getDb();

  // Check existing user
  const check = db.prepare('SELECT id FROM users WHERE username = ?');
  check.bind([username.trim()]);
  if (check.step()) {
    check.free();
    return res.status(409).json({ error: '用户名已被占用' });
  }
  check.free();

  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username.trim(), hash]);
  saveToDisk();

  // Get the new user's id
  const idResult = db.exec('SELECT last_insert_rowid()');
  const userId = idResult[0].values[0][0];
  const token = signToken(userId);

  res.status(201).json({ token, username: username.trim() });
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const db = await getDb();
  const stmt = db.prepare('SELECT id, username, password FROM users WHERE username = ?');
  stmt.bind([username.trim()]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const user = stmt.getAsObject();
  stmt.free();

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = signToken(user.id);
  res.json({ token, username: user.username });
});

module.exports = router;