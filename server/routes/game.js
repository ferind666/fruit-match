const { Router } = require('express');
const { getDb, saveToDisk } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

/** POST /api/game/save — upsert game state for the logged-in user */
router.post('/save', requireAuth, async (req, res) => {
  const { board, score, moves, combo, bestCombo } = req.body;

  if (!Array.isArray(board)) {
    return res.status(400).json({ error: '无效的游戏数据' });
  }

  const db = await getDb();
  const boardJson = JSON.stringify(board);

  // sql.js doesn't support ON CONFLICT, so do manual upsert
  const check = db.prepare('SELECT id FROM game_saves WHERE user_id = ?');
  check.bind([req.userId]);
  const exists = check.step();
  check.free();

  if (exists) {
    db.run(
      `UPDATE game_saves SET board_json = ?, score = ?, moves = ?, combo = ?, best_combo = ?, updated_at = datetime('now')
       WHERE user_id = ?`,
      [boardJson, score ?? 0, moves ?? 0, combo ?? 0, bestCombo ?? 0, req.userId]
    );
  } else {
    db.run(
      `INSERT INTO game_saves (user_id, board_json, score, moves, combo, best_combo, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [req.userId, boardJson, score ?? 0, moves ?? 0, combo ?? 0, bestCombo ?? 0]
    );
  }
  saveToDisk();

  res.json({ ok: true });
});

/** GET /api/game/load — return saved game state */
router.get('/load', requireAuth, async (req, res) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM game_saves WHERE user_id = ?');
  stmt.bind([req.userId]);

  if (!stmt.step()) {
    stmt.free();
    return res.json({ hasSave: false });
  }

  const save = stmt.getAsObject();
  stmt.free();

  res.json({
    hasSave: true,
    board: JSON.parse(save.board_json),
    score: save.score,
    moves: save.moves,
    combo: save.combo,
    bestCombo: save.best_combo,
    updatedAt: save.updated_at,
  });
});

/** DELETE /api/game/delete — remove saved game */
router.delete('/delete', requireAuth, async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM game_saves WHERE user_id = ?', [req.userId]);
  saveToDisk();
  res.json({ ok: true });
});

module.exports = router;