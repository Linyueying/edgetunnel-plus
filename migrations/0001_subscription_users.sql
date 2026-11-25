-- SPDX-License-Identifier: GPL-2.0-only
CREATE TABLE IF NOT EXISTS subscription_users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    node_uuid TEXT NOT NULL UNIQUE,
    sub_token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL CHECK (expires_at >= 0),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
);
