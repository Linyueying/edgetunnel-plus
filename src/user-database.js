// SPDX-License-Identifier: GPL-2.0-only
const createSubscriptionUsers = `
CREATE TABLE IF NOT EXISTS subscription_users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    node_uuid TEXT NOT NULL UNIQUE,
    sub_token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL CHECK (expires_at >= 0),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1)
)`;

const missingTable = /\bno such table:\s*(?:main\.)?subscription_users\b/i;

// Only the authenticated user API receives this binding. The normal statement is
// attempted first, so existing databases and deployments do not need a DDL call.
export function autoInitializeUserDatabase(database) {
	return {
		withSession(constraint) {
			const session = database.withSession(constraint);
			return {
				prepare(sql) {
					return {
						bind(...values) {
							const statement = session.prepare(sql).bind(...values);
							const execute = async method => {
								try {
									return await statement[method]();
								} catch (error) {
									if (!missingTable.test(String(error?.message)) && !missingTable.test(String(error?.cause))) throw error;
									await database.prepare(createSubscriptionUsers).run();
									return database.withSession('first-primary').prepare(sql).bind(...values)[method]();
								}
							};
							return {
								first: () => execute('first'),
								all: () => execute('all'),
								run: () => execute('run'),
							};
						},
					};
				},
			};
		},
	};
}
