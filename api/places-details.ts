import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1/places';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Prioriza chave enviada pelo cliente (configuração do usuário), senão usa a do servidor
    const apiKey = (req.headers['x-api-key'] as string) || process.env.GOOGLE_PLACES_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const placeId = req.query.placeId as string;

    if (!placeId) {
        return res.status(400).json({ error: 'Missing placeId query parameter' });
    }

    try {
        const fieldMask = (req.headers['x-goog-fieldmask'] as string) || '';

        const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/${placeId}`, {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fieldMask,
            },
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error (places-details):', error);
        return res.status(500).json({ error: 'Failed to fetch from Google Places API' });
    }
}
