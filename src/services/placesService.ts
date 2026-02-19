import type { PlaceDetails, Lead } from '../types';
import { ERROR_MESSAGES, GOOGLE_RESULTS_PER_PAGE } from '../constants';
import { getSupabase } from './supabaseService';

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

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: responseData, error } = await supabase.functions.invoke('google-places', {
      body: {
        action: 'textSearch',
        payload: {
          requestBody,
          fieldMask,
          apiKey: key
        }
      }
    });

    if (error) {
      if (error.message?.includes('403')) {
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      }
      throw new Error(`API Error: ${error.message}`);
    }

    const data = responseData as GoogleNewTextSearchResponse;

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

    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: responseData, error } = await supabase.functions.invoke('google-places', {
      body: {
        action: 'placeDetails',
        payload: {
          placeId,
          fieldMask,
          apiKey: key
        }
      }
    });

    if (error) {
      if (error.message?.includes('403')) {
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      }
      throw new Error(`API Error: ${error.message}`);
    }

    const data = responseData as GoogleNewPlaceDetailsResponse;

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
 * Helper: extract neighborhood name from a Brazilian formatted address.
 * Handles patterns like "Rua X, 123 - Bairro, Cidade - UF"
 */
function extractNeighborhoodFromAddress(address: string, city: string): string | null {
  const regex = new RegExp(` - ([^,]+), ${city}`, 'i');
  const backupRegex = new RegExp(`, ([^,]+), ${city}`, 'i');

  let match = address.match(regex);
  if (!match) {
    match = address.match(backupRegex);
  }

  if (!match || !match[1]) return null;

  let neighborhood = match[1].trim();

  // Fix for cases like "Loja 02 - Boqueirão"
  if (neighborhood.includes(' - ')) {
    const parts = neighborhood.split(' - ');
    neighborhood = parts[parts.length - 1].trim();
  }

  // Filter bad extractions
  if (
    neighborhood.length <= 2 ||
    /^\d+$/.test(neighborhood) ||
    neighborhood.toLowerCase().startsWith('loja ') ||
    neighborhood.toLowerCase().startsWith('apto ') ||
    neighborhood.toLowerCase().startsWith('sala ')
  ) {
    return null;
  }

  return neighborhood;
}

/**
 * Strategy 1 — Heuristic: search for common distributed places
 * (Schools, Pharmacies, Supermarkets, Bakeries) and extract neighborhood from address.
 */
async function fetchNeighborhoodsHeuristic(
  city: string,
  state: string,
  key: string
): Promise<string[]> {
  const results: string[] = [];

  const queries = [
    `Escola em ${city}, ${state}, Brasil`,
    `Farmácia em ${city}, ${state}, Brasil`,
    `Supermercado em ${city}, ${state}, Brasil`,
    `Padaria em ${city}, ${state}, Brasil`
  ];

  const fieldMask = ['places.formattedAddress', 'places.location'].join(',');

  const promises = queries.map(async (query) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: responseData, error } = await supabase.functions.invoke('google-places', {
      body: {
        action: 'textSearch',
        payload: {
          requestBody: { textQuery: query, languageCode: 'pt-BR', pageSize: 50 },
          fieldMask,
          apiKey: key
        }
      }
    });

    if (error) {
      console.warn(`Warning: Heuristic fetch failed for "${query}": ${error.message}`);
      return;
    }

    const data = responseData as GoogleNewTextSearchResponse;
    for (const place of data.places || []) {
      if (place.formattedAddress) {
        const name = extractNeighborhoodFromAddress(place.formattedAddress, city);
        if (name) results.push(name);
      }
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Strategy 2 — Direct: search Google Places for "bairros de [city]"
 * and extract neighborhood names from the returned addresses.
 */
async function fetchNeighborhoodsDirect(
  city: string,
  state: string,
  key: string
): Promise<string[]> {
  const results: string[] = [];

  const queries = [
    `bairros de ${city}, ${state}, Brasil`,
    `bairro ${city}, ${state}, Brasil`,
  ];

  const fieldMask = [
    'places.formattedAddress',
    'places.displayName',
    'places.location'
  ].join(',');

  const promises = queries.map(async (query) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: responseData, error } = await supabase.functions.invoke('google-places', {
      body: {
        action: 'textSearch',
        payload: {
          requestBody: { textQuery: query, languageCode: 'pt-BR', pageSize: 50 },
          fieldMask,
          apiKey: key
        }
      }
    });

    if (error) {
      console.warn(`Warning: Direct fetch failed for "${query}": ${error.message}`);
      return;
    }

    const data = responseData as GoogleNewTextSearchResponse;
    for (const place of data.places || []) {
      // Try to extract from address first
      if (place.formattedAddress) {
        const name = extractNeighborhoodFromAddress(place.formattedAddress, city);
        if (name) {
          results.push(name);
          continue;
        }
      }

      // Fallback: if the displayName looks like a neighborhood name (not the city itself)
      const displayName = place.displayName?.text?.trim();
      if (
        displayName &&
        displayName.length > 2 &&
        displayName.toLowerCase() !== city.toLowerCase() &&
        !/^\d+$/.test(displayName)
      ) {
        results.push(displayName);
      }
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Strategy 3 — Type-based: search Google Places with includedType 'sublocality'
 * and 'neighborhood' to get neighborhoods directly as place entities.
 */
async function fetchNeighborhoodsByType(
  city: string,
  state: string,
  key: string
): Promise<string[]> {
  const results: string[] = [];

  const types = ['sublocality', 'neighborhood'];
  const fieldMask = ['places.displayName', 'places.formattedAddress'].join(',');

  const promises = types.map(async (type) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: responseData, error } = await supabase.functions.invoke('google-places', {
      body: {
        action: 'textSearch',
        payload: {
          requestBody: {
            textQuery: `${city}, ${state}, Brasil`,
            languageCode: 'pt-BR',
            pageSize: 50,
            includedType: type,
          },
          fieldMask,
          apiKey: key
        }
      }
    });

    if (error) {
      console.warn(`Warning: Type-based fetch failed for type "${type}": ${error.message}`);
      return;
    }

    const data = responseData as GoogleNewTextSearchResponse;
    for (const place of data.places || []) {
      const displayName = place.displayName?.text?.trim();
      if (
        displayName &&
        displayName.length > 2 &&
        displayName.toLowerCase() !== city.toLowerCase() &&
        !/^\d+$/.test(displayName)
      ) {
        results.push(displayName);
      }
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Fetch neighborhoods for a city using three complementary strategies:
 * 1. Heuristic — Searches for common places (schools, pharmacies, etc.) and extracts
 *    neighborhood from the formatted address.
 * 2. Direct — Searches for "bairros de [city]" via Google Places API.
 * 3. Type-based — Searches with includedType 'sublocality' / 'neighborhood' to get
 *    neighborhoods directly as Google place entities.
 *
 * Results are merged with case-insensitive deduplication.
 *
 * @param city - City name
 * @param state - State abbreviation
 * @param apiKey - Google Places API key (optional, falls back to env)
 * @returns Array of unique neighborhood names, sorted alphabetically
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

  try {
    // Run all three strategies in parallel
    const [heuristicResults, directResults, typeResults] = await Promise.all([
      fetchNeighborhoodsHeuristic(city, state, key),
      fetchNeighborhoodsDirect(city, state, key),
      fetchNeighborhoodsByType(city, state, key),
    ]);

    // Case-insensitive deduplication
    const seen = new Map<string, string>(); // lowercase → original casing
    for (const name of [...heuristicResults, ...directResults, ...typeResults]) {
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.set(lower, name);
      }
    }

    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}

