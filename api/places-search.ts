import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Prioriza chave enviada pelo cliente (configuração do usuário), senão usa a do servidor
    const apiKey = (req.headers['x-api-key'] as string) || process.env.GOOGLE_PLACES_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    try {
        const fieldMask = (req.headers['x-goog-fieldmask'] as string) || '';

        const response = await fetch(GOOGLE_PLACES_SEARCH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error (places-search):', error);
        return res.status(500).json({ error: 'Failed to fetch from Google Places API' });
    }
}
