import type { PlaceDetails, Lead } from '../types';
import { ERROR_MESSAGES, API_ENDPOINTS, GOOGLE_RESULTS_PER_PAGE, PAGINATION_DELAY_MS } from '../constants';

const DEFAULT_GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

/**
 * Response from Google Places API (New) - Text Search
 */
interface GoogleNewTextSearchResponse {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode?: string };
    formattedAddress?: string;
    types?: string[];
    location?: { latitude: number; longitude: number };
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
  }>;
  nextPageToken?: string;
}

/**
 * Response from Google Places API (New) - Place Details
 */
interface GoogleNewPlaceDetailsResponse {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  types?: string[];
}

/**
 * Search for places using Google Places API (New) - Text Search
 * @param city - City name
 * @param state - State abbreviation
 * @param category - Business category (optional)
 * @param pageToken - Token for next page (optional)
 * @param apiKey - Google Places API key (optional, falls back to env)
 * @param neighborhood - Neighborhood name (optional)
 * @returns Object with results and next page token
 */
export async function searchPlaces(
  city: string,
  state: string,
  category: string = 'restaurante',
  pageToken: string | null = null,
  apiKey: string | null = null,
  neighborhood: string | null = null
): Promise<{ results: Lead[]; nextPageToken: string | null }> {
  const key = apiKey || DEFAULT_GOOGLE_PLACES_KEY;

  if (!key) {
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  try {
    // Build search query
    const locationPart = neighborhood
      ? `${neighborhood}, ${city}, ${state}`
      : `${city}, ${state}`;
    const textQuery = `${category} em ${locationPart}, Brasil`;

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.types',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'nextPageToken'
    ].join(',');

    const requestBody: Record<string, unknown> = {
      textQuery,
      languageCode: 'pt-BR',
      pageSize: GOOGLE_RESULTS_PER_PAGE,
    };

    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    const response = await fetch(API_ENDPOINTS.GOOGLE_PLACES_SEARCH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as GoogleNewTextSearchResponse;

    const places = data.places || [];

    // Map results to our schema
    const results: Lead[] = places.map(place => ({
      place_id: place.id,
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      city,
      state,
      category: place.types?.[0] || 'unknown',
      phone: place.nationalPhoneNumber || undefined,
      website: place.websiteUri || undefined,
      rating: place.rating || undefined,
      user_ratings_total: place.userRatingCount || undefined,
      status: 'NEW',
      notes: [],
    }));

    return {
      results,
      nextPageToken: data.nextPageToken || null,
    };
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
}

/**
 * Utility function to wait (needed between pagination calls per Google's policy)
 * @param ms - Milliseconds to wait
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get place details by place_id
 * @param placeId - Google Place ID
 * @param apiKey - Google Places API key (optional, falls back to env)
 * @returns Place details including phone and website
 */
export async function getPlaceDetails(
  placeId: string,
  apiKey: string | null = null
): Promise<PlaceDetails> {
  const key = apiKey || DEFAULT_GOOGLE_PLACES_KEY;

  if (!key) {
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  try {
    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'websiteUri',
      'rating',
      'userRatingCount',
      'location',
      'types'
    ].join(',');

    const url = `${API_ENDPOINTS.GOOGLE_PLACES_DETAILS}/${placeId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as GoogleNewPlaceDetailsResponse;

    return {
      place_id: data.id,
      name: data.displayName?.text || '',
      formatted_address: data.formattedAddress,
      formatted_phone_number: data.nationalPhoneNumber,
      international_phone_number: data.internationalPhoneNumber,
      website: data.websiteUri,
      rating: data.rating,
      user_ratings_total: data.userRatingCount,
      phone: data.nationalPhoneNumber || undefined,
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}

/**
 * Fetch neighborhoods for a city using Google Places API (New) Text Search
 * @param city - City name
 * @param state - State abbreviation
 * @param apiKey - Google Places API key (optional, falls back to env)
 * @returns Array of unique neighborhood names
 */
export async function fetchNeighborhoods(
  city: string,
  state: string,
  apiKey: string | null = null
): Promise<string[]> {
  const key = apiKey || DEFAULT_GOOGLE_PLACES_KEY;

  if (!key) {
    throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
  }

  const allNeighborhoods: Set<string> = new Set();
  let pageToken: string | null = null;

  try {
    do {
      const fieldMask = [
        'places.displayName',
        'nextPageToken'
      ].join(',');

      const requestBody: Record<string, unknown> = {
        textQuery: `bairros de ${city}, ${state}, Brasil`,
        languageCode: 'pt-BR',
        pageSize: GOOGLE_RESULTS_PER_PAGE,
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await fetch(API_ENDPOINTS.GOOGLE_PLACES_SEARCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json() as GoogleNewTextSearchResponse;
      const places = data.places || [];

      for (const place of places) {
        const name = place.displayName?.text;
        if (name) {
          allNeighborhoods.add(name);
        }
      }

      pageToken = data.nextPageToken || null;

      if (pageToken) {
        await sleep(PAGINATION_DELAY_MS);
      }
    } while (pageToken);

    return [...allNeighborhoods].sort();
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}
