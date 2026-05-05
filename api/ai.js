const DEFAULT_MODEL = 'gpt-4o-mini';

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 2_000_000) {
                reject(new Error('Request body too large'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
        return res
            .status(500)
            .json({ error: { message: 'OPENAI_API_KEY is not set on server' } });
    }

    try {
        const payload = await readJson(req);
        const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
        const systemPrompt =
            typeof payload?.systemPrompt === 'string' ? payload.systemPrompt : '';
        const model =
            typeof payload?.model === 'string' && payload.model.trim()
                ? payload.model.trim()
                : DEFAULT_MODEL;

        if (!text) {
            return res.status(400).json({ error: { message: 'Missing text' } });
        }

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
}

