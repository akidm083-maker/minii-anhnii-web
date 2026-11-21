import type { IncomingMessage, ServerResponse } from 'node:http';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const existing = rateBuckets.get(ip);
  if (!existing || now > existing.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (existing.count >= RATE_MAX_REQUESTS) {
    return true;
  }
  existing.count += 1;
  return false;
}

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

function sanitizeField(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim().slice(0, maxLen);
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'unknown';

  if (isRateLimited(ip)) {
    sendJson(res, 429, {
      ok: false,
      code: 'RATE_LIMITED',
      error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.',
    });
    return;
  }

  const webhookUrl = getValidDiscordWebhookUrl();
  if (!webhookUrl) {
    sendJson(res, 503, {
      ok: false,
      code: 'DISCORD_NOT_CONFIGURED',
      error: 'Discord webhook тохируулаагүй байна.',
    });
    return;
  }

  let parsedBody: Record<string, unknown> = {};
  if (req.body && typeof req.body === 'object') {
    parsedBody = req.body as Record<string, unknown>;
  } else {
    try {
      const chunks: Buffer[] = [];
      let totalSize = 0;
      for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalSize += buf.length;
        if (totalSize > 16384) {
          sendJson(res, 413, { ok: false, error: 'Хүсэлтийн хэмжээ хэтэрсэн байна.' });
          return;
        }
        chunks.push(buf);
      }
      const rawText = Buffer.concat(chunks).toString('utf8');
      if (rawText) {
        const json = JSON.parse(rawText);
        if (json && typeof json === 'object') {
          parsedBody = json as Record<string, unknown>;
        }
      }
    } catch {
      sendJson(res, 400, { ok: false, error: 'Буруу хүсэлт.' });
      return;
    }
  }

  const name = sanitizeField(parsedBody.name, 80);
  const contact = sanitizeField(parsedBody.contact, 120);
  const subject = sanitizeField(parsedBody.subject, 120) || 'Хамтран ажиллах санал';
  const message = sanitizeField(parsedBody.message, 1500);
  const savedToFirebase = Boolean(parsedBody.savedToFirebase);

  if (!name || !message) {
    sendJson(res, 400, {
      ok: false,
      code: 'INVALID_INPUT',
      error: 'Нэр болон зурвасаа заавал бөглөнө үү.',
    });
    return;
  }

  const discordPayload = {
    username: 'Portfolio · Хамтын ажиллагаа',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `Шинэ хамтын ажиллагааны санал: ${subject}`.slice(0, 256),
        description: message.slice(0, 1500),
        color: 0xfbbf24,
        fields: [
          { name: 'Илгээгч', value: name, inline: true },
          { name: 'Холбоо барих хаяг', value: contact || 'Тодорхойгүй', inline: true },
          {
            name: 'Firebase хадгалалт',
            value: savedToFirebase ? 'Хадгалагдсан' : 'Зөвхөн Discord',
            inline: true,
          },
        ],
        footer: { text: 'Chingis Portfolio · Discord Webhook' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!discordRes.ok) {
      sendJson(res, 502, {
        ok: false,
        code: 'DISCORD_UPSTREAM_ERROR',
        error: 'Discord сервер рүү илгээхэд алдаа гарлаа.',
      });
      return;
    }

    sendJson(res, 200, { ok: true });
  } catch {
    sendJson(res, 502, {
      ok: false,
      code: 'DISCORD_REQUEST_FAILED',
      error: 'Discord руу холбогдох үед саатал гарлаа.',
    });
  }
}
