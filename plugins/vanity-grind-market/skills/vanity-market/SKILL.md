---
name: vanity-market
description: Price Solana vanity addresses, appraise how rare an address is, and read the three.ws grind-bounty board, stats, leaderboard and proof-of-grind gallery through the vanity-mcp tools. Use when asked what a vanity pattern costs, how rare an address is, or what bounties are open.
---

# Vanity grind-bounty market (read only)

The plugin starts `@three-ws/vanity-mcp` over stdio (`npx -y @three-ws/vanity-mcp`, bin `vanity-mcp`). It wraps the public three.ws `/api/vanity` HTTP API. It needs no key, signer or payment and every tool is read only.

## Environment (both optional)

- `THREE_WS_BASE`: API origin, default `https://three.ws`.
- `THREE_WS_TIMEOUT_MS`: per-request timeout in milliseconds, default 20000.

## Tools

| Tool | Arguments | Use |
| --- | --- | --- |
| `vanity_quote` | `prefix`, `suffix` (Base58, at least one), `ignoreCase` | Difficulty, expected attempts, tier and a suggested USDC bounty in atomic units. |
| `vanity_appraise` | `address` (32-44 chars), `prefixLen`, `suffixLen` | Detected pattern, rarity score and bits, tier. Returns the gallery entry too if the address was published. |
| `vanity_board` | `status` (`open`, `all`, `settled`), `sort` (`recency`, `reward`, `expiry`), `limit` (1-100), `offset` | Browse bounties with pattern, USDC amount, status and timing. |
| `vanity_open` | `limit` (1-100) | The claimable queue of open, unexpired bounties. |
| `vanity_stats` | none | Open count, USDC escrowed, USDC paid out. |
| `vanity_leaderboard` | `limit` (1-100, default 10) | Top grinders by USDC earned. |
| `vanity_config` | none | Whether payouts are configured, settlement asset, live escrow networks, pricing band. |
| `vanity_gallery` | `sort` (`score`, `recency`), `tier`, `minLength`, `contains`, `limit`, `offset` | Published rare addresses with receipts. |

## Worked example

Request: "What would it cost to grind an address starting with THREE, and is the market live?"

1. Call `vanity_config` and check that payouts are configured.
2. Call `vanity_quote` with `{ "prefix": "THREE" }` and report the difficulty and the suggested bounty. Atomic units are USDC with the decimals that `vanity_config` reports.
3. Call `vanity_board` with `{ "status": "open", "sort": "reward", "limit": 5 }` to show comparable bounties.

## Notes

- Posting a bounty and claiming one are separate writes on the HTTP API (posting is x402 paid). This plugin does neither, so never claim it posted or paid anything.
- A Base58 pattern cannot contain `0`, `O`, `I` or `l`. Quote errors for an invalid pattern come from the API, so report them as is.
- Do not guess an address. Use the one the user gives you.
