// SPDX-License-Identifier: GPL-2.0-only
import app from '../src/edgetunnel.js';
import { autoInitializeUserDatabase } from '../src/user-database.js';

const userAdminApi = /^\/admin\/users\/api(?:\/|$)/i;

export async function onRequest(context) {
	const { request, env } = context;
	if (!userAdminApi.test(new URL(request.url).pathname)) return app.fetch(request, env, context);

	if (env.USERS_DB) {
		return app.fetch(request, { ...env, USERS_DB: autoInitializeUserDatabase(env.USERS_DB) }, context);
	}
	const response = await app.fetch(request, env, context);
	if (response.status !== 503) return response;
	const body = await response.clone().json();
	if (body.error !== '请先绑定 USERS_DB 数据库并执行建表 SQL。') return response;
	return Response.json({ error: '请在 Cloudflare Pages 设置中绑定 USERS_DB 数据库，然后重新部署。' }, {
		status: response.status, headers: response.headers,
	});
}
