import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

function loadEnv() {
    // Re-load .env on each request so edits apply without restart (local dev only).
    dotenv.config({ override: true });
}

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/public-config', (req, res) => {
    loadEnv();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({
        __source: 'dev-server',
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    });
});

app.post('/api/ai', async (req, res) => {
    loadEnv();
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        return res
            .status(500)
            .json({
                error: { message: 'OPENAI_API_KEY is not set in .env' },
                debug: {
                    hasOpenAIKeyVar: Object.prototype.hasOwnProperty.call(
                        process.env,
                        'OPENAI_API_KEY'
                    ),
                    envPathHint: 'Make sure .env is in project root and restart dev server.',
                },
            });
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const systemPrompt =
        typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt : '';
    const model =
        typeof req.body?.model === 'string' && req.body.model.trim()
            ? req.body.model.trim()
            : 'gpt-4o-mini';

    if (!text) {
        return res.status(400).json({ error: { message: 'Missing text' } });
    }

    try {
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    ...(systemPrompt
                        ? [{ role: 'system', content: systemPrompt }]
                        : []),
                    { role: 'user', content: text },
                ],
            }),
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            const msg =
                data?.error?.message ||
                `${upstream.status} ${upstream.statusText || ''}`.trim();
            return res.status(502).json({ error: { message: msg || 'Upstream error' } });
        }

        const content = data?.choices?.[0]?.message?.content ?? '';
        return res.status(200).json({ content: String(content) });
    } catch (e) {
        return res.status(500).json({
            error: { message: e && e.message ? String(e.message) : 'Server error' },
        });
    }
});

app.use(express.static(__dirname));

app.get('/:page', (req, res, next) => {
    const p = String(req.params.page || '');
    if (!p || p.includes('.') || p.includes('/')) return next();

    const htmlPath = path.join(__dirname, `${p}.html`);
    res.sendFile(htmlPath, (err) => {
        if (err) next();
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

async function listenWithFallback(startPort) {
    const maxTries = 10;
    for (let i = 0; i < maxTries; i++) {
        const port = startPort + i;
        try {
            const server = await new Promise((resolve, reject) => {
                const s = app.listen(port, () => resolve(s));
                s.on('error', reject);
            });
            console.log(`Local dev server running on http://localhost:${port}`);
            return server;
        } catch (err) {
            if (err && err.code === 'EADDRINUSE') {
                continue;
            }
            throw err;
        }
    }
    throw new Error(`No free port found in range ${startPort}-${startPort + maxTries - 1}`);
}

const startPort = Number(process.env.PORT || 4173);
await listenWithFallback(startPort);

// Keep the process alive.
setInterval(() => {}, 1 << 30);

