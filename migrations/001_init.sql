CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY,
  owner_login TEXT NOT NULL,
  title       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  run_id      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_run ON tasks (owner_login, run_id);