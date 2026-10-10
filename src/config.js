// Centralized env + HTTP base for the vanity MCP.
//
// This server is a thin, read-only wrapper over the PUBLIC three.ws HTTP API
// (/api/vanity). It signs nothing and holds no secret — the only knobs are which
// deployment to talk to and how long to wait. Nothing about how a bounty is
// priced or an address is appraised is baked in here; it all comes from the live
// endpoint.

export function env(key, fallback) {
	const v = process.env[key];
	return v !== undefined && String(v).trim() !== '' ? String(v).trim() : fallback;
}

// Base URL of the three.ws API that serves /api/vanity. Override only when
// self-hosting or pointing at a preview deployment.
export const THREE_WS_BASE = env('THREE_WS_BASE', 'https://three.ws').replace(/\/+$/, '');

// Per-request timeout (ms). These are all read endpoints — quote runs an honest
// difficulty oracle and the board/gallery hit a store — so the default is brisk
// but leaves headroom for a cold cache.
export const HTTP_TIMEOUT_MS = (() => {
	const raw = env('THREE_WS_TIMEOUT_MS');
	if (raw === undefined) return 20000;
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) {
		throw Object.assign(new Error(`THREE_WS_TIMEOUT_MS must be a positive number (got "${raw}")`), {
			code: 'bad_config',
		});
	}
	return n;
})();

// Identifies this client to the API in request logs.
export const USER_AGENT = '@three-ws/vanity-mcp';
