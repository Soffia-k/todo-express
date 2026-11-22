const router = require('express').Router();
const { pool } = require('../db');
const { ownerLogin } = require('../config');
const { isUuid, validateTitle, validateRunId } = require('../validate');

function toApi(row) {
  return {
    id: row.id,
    ownerLogin: row.owner_login,
    title: row.title,
    done: row.done,
    runId: row.run_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

// POST /api/tasks/
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['title', 'runId'];
    const extra = Object.keys(body).filter(k => !allowed.includes(k));
    if (extra.length) return res.status(400).json({ error: 'unexpected fields' });

    const title = validateTitle(body.title);
    const runId = validateRunId(body.runId);
    if (title === null) return res.status(400).json({ error: 'invalid title' });
    if (runId === null) return res.status(400).json({ error: 'invalid runId' });

    const id = require('crypto').randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO tasks (id, owner_login, title, done, run_id)
       VALUES ($1, $2, $3, false, $4)
       RETURNING *`,
      [id, ownerLogin, title, runId]
    );
    res.status(201).json(toApi(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: 'database error' });
  }
});

// GET /api/tasks/?runId=...
router.get('/', async (req, res) => {
  try {
    const runId = req.query.runId;
    if (typeof runId !== 'string' || !runId) {
      return res.status(400).json({ error: 'runId required' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM tasks WHERE owner_login = $1 AND run_id = $2 ORDER BY created_at`,
      [ownerLogin, runId]
    );
    res.json(rows.map(toApi));
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: 'database error' });
  }
});

// GET /api/tasks/:id/
router.get('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tasks WHERE id = $1 AND owner_login = $2`,
      [req.params.id, ownerLogin]
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(toApi(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: 'database error' });
  }
});

// PATCH /api/tasks/:id/
router.patch('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  try {
    const body = req.body || {};
    const allowed = ['title', 'done'];
    const extra = Object.keys(body).filter(k => !allowed.includes(k));
    if (extra.length) return res.status(400).json({ error: 'unexpected fields' });
    if (!('title' in body) && !('done' in body)) {
      return res.status(400).json({ error: 'empty update' });
    }

    const sets = [];
    const vals = [];
    let i = 1;

    if ('title' in body) {
      const t = validateTitle(body.title);
      if (t === null) return res.status(400).json({ error: 'invalid title' });
      sets.push(`title = $${i++}`);
      vals.push(t);
    }
    if ('done' in body) {
      if (typeof body.done !== 'boolean') {
        return res.status(400).json({ error: 'invalid done' });
      }
      sets.push(`done = $${i++}`);
      vals.push(body.done);
    }

    vals.push(req.params.id, ownerLogin);
    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets.join(', ')}
       WHERE id = $${i++} AND owner_login = $${i}
       RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(toApi(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: 'database error' });
  }
});

// DELETE /api/tasks/:id/
router.delete('/:id', async (req, res) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND owner_login = $2`,
      [req.params.id, ownerLogin]
    );
    if (!rowCount) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(503).json({ error: 'database error' });
  }
});

module.exports = router;