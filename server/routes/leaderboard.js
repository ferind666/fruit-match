const { Router } = require('express');
const { getDb, saveToDisk } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

/** POST /api/leaderboard/submit — record a finished game */
router.post('/submit', requireAuth, async (req, res) => {
  const { score, moves, bestCombo } = req.body;

  if (score == null) {
    return res.status(400).json({ error: '无效的分数' });
  }

  const db = await getDb();
  db.run(
    'INSERT INTO leaderboard (user_id, score, moves, best_combo) VALUES (?, ?, ?, ?)',
    [req.userId, score, moves ?? 0, bestCombo ?? 0]
  );
  saveToDisk();

  res.json({ ok: true });
});

/** GET /api/leaderboard — top scores or top combos */
router.get('/', async (req, res) => {
  const sortBy = req.query.sortBy === 'combo' ? 'best_combo' : 'score';
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const db = await getDb();

  // Build query (column names are safe — only two hardcoded choices)
  const sql = `
    SELECT u.username, l.score, l.moves, l.best_combo, l.played_at
    FROM leaderboard l
    JOIN users u ON u.id = l.user_id
    ORDER BY l.${sortBy} DESC
    LIMIT ?
  `;

  const stmt = db.prepare(sql);
  stmt.bind([limit]);

  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  const leaderboard = rows.map((row, i) => ({ ...row, rank: i + 1 }));
  res.json({ leaderboard, sortBy });
});

module.exports = router;