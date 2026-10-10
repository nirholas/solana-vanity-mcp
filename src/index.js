#!/usr/bin/env node
// @three-ws/vanity-mcp — MCP server entry point.
//
// Gives any AI assistant the three.ws vanity-address bounty market + rarity
// gallery over stdio — all read/discovery surface:
//   • vanity_quote       — pattern → honest difficulty + suggested USDC bounty
//   • vanity_appraise    — rarity of any Solana address (pure math)
//   • vanity_board       — browse the grind-bounty board
//   • vanity_open        — claimable queue workers poll
//   • vanity_stats       — live market totals
//   • vanity_leaderboard — top grinders by USDC earned
//   • vanity_config      — payout availability + asset/network metadata
//   • vanity_gallery     — browse the proof-of-grind rarity gallery
//
// A thin wrapper over the PUBLIC three.ws API (/api/vanity). No keys, no signer,
// no payment — point THREE_WS_BASE at a deployment and go. Posting or claiming a
// bounty is the x402-paid write path on the HTTP API; this MCP exposes the
// read/discovery + rarity surface.
//
// Run standalone:
//   node packages/vanity-mcp/src/index.js
//
// Or wire into Claude Code / Cursor — see README.md.

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { def as vanityQuote } from './tools/vanity-quote.js';
import { def as vanityAppraise } from './tools/vanity-appraise.js';
import { def as vanityBoard } from './tools/vanity-board.js';
import { def as vanityOpen } from './tools/vanity-open.js';
import { def as vanityStats } from './tools/vanity-stats.js';
import { def as vanityLeaderboard } from './tools/vanity-leaderboard.js';
import { def as vanityConfig } from './tools/vanity-config.js';
import { def as vanityGallery } from './tools/vanity-gallery.js';

// Single source of truth for the advertised server version — package.json.
const require = createRequire(import.meta.url);
const { version: PKG_VERSION } = require('../package.json');

export const TOOLS = [
	vanityQuote,
	vanityAppraise,
	vanityBoard,
	vanityOpen,
	vanityStats,
	vanityLeaderboard,
	vanityConfig,
	vanityGallery,
];

/**
 * Construct a fully-registered McpServer without connecting a transport.
 * Registration is env-free, so this is safe to import from tests.
 * @returns {McpServer}
 */
export function buildServer() {
	const server = new McpServer(
		{ name: 'vanity-mcp', title: 'three.ws Vanity', version: PKG_VERSION },
		{
			capabilities: { tools: {} },
			instructions:
				'three.ws Vanity MCP — the read/discovery surface of the secret-blind grind-bounty market for HARD ' +
				'Solana vanity addresses. A requester escrows a USDC bounty for a pattern; a fleet of independent ' +
				'workers grinds it in parallel and the first to submit a verified key matching the pattern is paid ' +
				'on-chain — yet the found secret is sealed to the requester, so the worker earns the bounty without ' +
				'ever seeing the wallet. vanity_quote prices a pattern from an honest difficulty oracle; ' +
				'vanity_appraise scores the rarity of any address. vanity_board, vanity_open, vanity_stats, ' +
				'vanity_leaderboard, and vanity_config read the live market; vanity_gallery browses the ' +
				'proof-of-grind rarity gallery. All data comes live from the public three.ws /api/vanity endpoints ' +
				'— no API key, signer, or payment required. Posting or claiming a bounty is the x402-paid write path ' +
				'on the HTTP API; this server exposes only reads.',
		},
	);

	for (const tool of TOOLS) {
		server.registerTool(
			tool.name,
			{
				title: tool.title,
				description: tool.description,
				inputSchema: tool.inputSchema,
				annotations: tool.annotations,
			},
			async (args, extra) => {
				try {
					const result = await tool.handler(args, extra);
					const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
					return { content: [{ type: 'text', text }] };
				} catch (err) {
					const payload = {
						ok: false,
						error: err?.code || 'unhandled',
						message: err?.message || String(err),
						...(err?.status ? { status: err.status } : {}),
					};
					return {
						content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
						isError: true,
					};
				}
			},
		);
	}

	return server;
}

async function main() {
	const server = buildServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error(`[vanity-mcp@${PKG_VERSION}] connected over stdio with ${TOOLS.length} tools`);
}

// Connect stdio ONLY when this file is the process entry point. Importing the
// module (tests, embedding) must not grab the transport. realpath both sides:
// npm bin shims are symlinks, so argv[1] may differ from import.meta.url.
function isProcessEntryPoint() {
	if (!process.argv[1]) return false;
	try {
		return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
	} catch {
		return false;
	}
}

if (isProcessEntryPoint()) {
	main().catch((err) => {
		console.error('[vanity-mcp] fatal:', err);
		process.exit(1);
	});
}
