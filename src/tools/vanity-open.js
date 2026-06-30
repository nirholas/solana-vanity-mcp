// `vanity_open` — the claimable bounty queue workers poll. Read-only.
//
// Wraps GET /api/vanity/bounties?view=open. Live queue of open, unexpired
// bounties — changes constantly, so NOT idempotent.

import { z } from 'zod';

import { apiRequest } from '../lib/api.js';

export const def = {
	name: 'vanity_open',
	title: 'List claimable open bounties for workers',
	annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: true },
	description:
		'List the open, unexpired bounties a grinding worker can race to claim — the queue worker fleets poll. Each entry carries the pattern to grind and the escrowed USDC reward; the first worker to submit a verified, sealed key wins. Read-only discovery; submitting a claim is a separate write on the HTTP API.',
	inputSchema: {
		limit: z.number().int().min(1).max(100).optional().describe('Max claimable bounties to return (1–100, default 30).'),
	},
	async handler(args) {
		const data = await apiRequest('/api/vanity/bounties', {
			query: { view: 'open', limit: args?.limit },
		});
		return {
			ok: true,
			bounties: data?.bounties ?? [],
			count: data?.count ?? (Array.isArray(data?.bounties) ? data.bounties.length : 0),
		};
	},
};
