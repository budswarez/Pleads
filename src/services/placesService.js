const DEFAULT_GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

/**
 * Search for places using Google Places API (Text Search)
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} category - Business category (optional)
 * @param {string} pageToken - Token for next page (optional)
 * @param {string} apiKey - Google Places API key (optional, falls back to env)
 * @returns {Promise<{results: Array, nextPageToken: string}>} Object with results and next page token
 */
export async function searchPlaces(city, state, category = 'restaurante', pageToken = null, apiKey = null, neighborhood = null) {
    const key = apiKey || DEFAULT_GOOGLE_PLACES_KEY;

    if (!key) {
        throw new Error('API Key do Google Places não configurada. Acesse Configurações para adicionar sua chave.');
    }

    try {
        // Build search query
        const locationPart = neighborhood ? `${neighborhood}, ${city}, ${state}` : `${city}, ${state}`;
        const query = `${category} em ${locationPart}, Brasil`;

        // Using local proxy to avoid CORS
        let url = `/api/google/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;

        if (pageToken) {
            url += `&pagetoken=${pageToken}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            if (data.status === 'REQUEST_DENIED') {
                throw new Error('API Key inválida ou sem permissão. Verifique sua chave nas Configurações.');
            }
            throw new Error(`Places API Error: ${data.status}`);
        }

        // Map results to our schema
        const results = data.results.map(place => ({
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            city,  // Crucial for filtering
            state, // Crucial for filtering
            category: place.types?.[0] || 'unknown',
            location: {
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
            },
            phone: place.formatted_phone_number || null,
            rating: place.rating || null,
            status: 'NEW',
            notes: [],
            website: null,
            createdAt: new Date().toISOString(),
        }));

        return {
            results,
            nextPageToken: data.next_page_token || null
        };
    } catch (error) {
        console.error('Error searching places:', error);
        throw error;
    }
}

/**
 * Utility function to wait (needed between pagination calls per Google's policy)
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get place details by place_id
 * @param {string} placeId - Google Place ID
 * @param {string} apiKey - Google Places API key (optional, falls back to env)
 */
export async function getPlaceDetails(placeId, apiKey = null) {
    const key = apiKey || DEFAULT_GOOGLE_PLACES_KEY;

    if (!key) {
        throw new Error('API Key do Google Places não configurada.');
    }

    try {
        const url = `/api/google/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,geometry,types,website&key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            return {
                ...data.result,
                phone: data.result.formatted_phone_number || null,
                website: data.result.website || null
            };
        }

        throw new Error(`Details API Error: ${data.status}`);
    } catch (error) {
        console.error('Error getting place details:', error);
        throw error;
    }
}

