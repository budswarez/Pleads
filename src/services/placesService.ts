import { PlacesSearchResponse } from '../types';
import { GOOGLE_RESULTS_PER_PAGE } from '../constants';

/**
 * Sleep helper for delays
 */
export const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), ms);
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });
};

/**
 * Search places using Google Places API (New) via Proxy
 */
export const searchPlaces = async (
  city: string,
  state: string,
  query: string,
  pageToken: string | null = null,
  apiKey: string,
  neighborhood: string | null = null,
  signal?: AbortSignal
): Promise<PlacesSearchResponse> => {
  // Construct text query
  let textQuery = `${query} em ${city}, ${state}`;
  if (neighborhood) {
    textQuery = `${query} em ${neighborhood}, ${city}, ${state}`;
  }

  const requestBody: any = {
    textQuery,
    pageSize: GOOGLE_RESULTS_PER_PAGE,
  };

  if (pageToken) {
    requestBody.pageToken = pageToken;
  }

  // Field mask for Places API (New)
  // Requesting all necessary fields upfront to avoid Details calls
  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'nextPageToken'
  ].join(',');

  const response = await fetch('/api/places-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': fieldMask,
      'X-Api-Key': apiKey // Proxy will handle this
    },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();

  // Map API (New) response format to our internal format
  const results = (data.places || []).map((place: any) => ({
    place_id: place.id,
    name: place.displayName?.text || 'Sem nome',
    address: place.formattedAddress || '',
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    geometry: place.location ? {
      location: {
        lat: place.location.latitude,
        lng: place.location.longitude
      }
    } : undefined
  }));

  return {
    results,
    status: 'OK',
    next_page_token: data.nextPageToken
  };
};

/**
 * Fetch neighborhoods for a city using Google Places API
 */
export const fetchNeighborhoods = async (
  city: string,
  state: string,
  apiKey: string
): Promise<string[]> => {
  const textQuery = `bairros de ${city}, ${state}, Brasil`;
  
  const response = await fetch('/api/places-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': 'places.displayName',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({
      textQuery,
      pageSize: 20 // Fetch up to 20 neighborhoods
    })
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar bairros');
  }

  const data = await response.json();
  
  // Extract neighborhood names and clean them up
  const neighborhoods = (data.places || [])
    .map((p: any) => p.displayName?.text)
    .filter((n: string | undefined) => n && !n.includes(city)) // Simple filter
    .sort() as string[];

  return [...new Set(neighborhoods)]; // Deduplicate
};