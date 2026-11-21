import type { IncomingMessage, ServerResponse } from 'node:http';

function getValidDiscordWebhookUrl(): string | null {
  const raw = (process.env.DISCORD_WEBHOOK_URL || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return null;
    const allowedHosts = new Set([
      'discord.com',
      'discordapp.com',
      'ptb.discord.com',
      'canary.discord.com',
    ]);
    if (!allowedHosts.has(parsed.hostname)) {
      return null;
    }
    if (!parsed.pathname.startsWith('/api/webhooks/')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ configured: Boolean(getValidDiscordWebhookUrl()) }));
}
