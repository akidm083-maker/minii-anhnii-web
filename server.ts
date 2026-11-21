import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/discord-status', (_req: Request, res: Response) => {
    res.json({ configured: Boolean(getValidDiscordWebhookUrl()) });
  });

  app.post('/api/contact-discord', async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.',
      });
      return;
    }

    const webhookUrl = getValidDiscordWebhookUrl();
    if (!webhookUrl) {
      res.status(503).json({
        ok: false,
        code: 'DISCORD_NOT_CONFIGURED',
        error: 'Discord webhook тохируулаагүй байна.',
      });
      return;
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = sanitizeField((body as Record<string, unknown>).name, 80);
    const contact = sanitizeField((body as Record<string, unknown>).contact, 120);
    const subject =
      sanitizeField((body as Record<string, unknown>).subject, 120) || 'Хамтран ажиллах санал';
    const message = sanitizeField((body as Record<string, unknown>).message, 1500);
    const savedToFirebase = Boolean((body as Record<string, unknown>).savedToFirebase);

    if (!name || !message) {
      res.status(400).json({
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
            {
              name: 'Илгээгч',
              value: name,
              inline: true,
            },
            {
              name: 'Холбоо барих хаяг',
              value: contact || 'Тодорхойгүй',
              inline: true,
            },
            {
              name: 'Firebase хадгалалт',
              value: savedToFirebase ? 'Хадгалагдсан' : 'Зөвхөн Discord',
              inline: true,
            },
          ],
          footer: {
            text: 'Chingis Portfolio · Discord Webhook',
          },
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
        console.error('Discord webhook responded with status:', discordRes.status);
        res.status(502).json({
          ok: false,
          code: 'DISCORD_UPSTREAM_ERROR',
          error: 'Discord сервер рүү илгээхэд алдаа гарлаа.',
        });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to forward proposal to Discord:', err instanceof Error ? err.message : 'Unknown error');
      res.status(502).json({
        ok: false,
        code: 'DISCORD_REQUEST_FAILED',
        error: 'Discord руу холбогдох үед саатал гарлаа.',
      });
    }
  });

  if (IS_PRODUCTION) {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
