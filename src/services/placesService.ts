import type { PlaceDetails, Lead } from '../types';
import { ERROR_MESSAGES } from '../constants';

const DEFAULT_GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY;

/**
 * Response from Google Places Text Search API
 */
interface GooglePlacesTextSearchResponse {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    types?: string[];
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    user_ratings_total?: number;
    formatted_phone_number?: string;
  }>;
  next_page_token?: string;
  error_message?: string;
}

/**
 * Response from Google Places Details API
 */
interface GooglePlaceDetailsResponse {
  status: string;
  result: {
    place_id: string;
    name: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
    types?: string[];
    rating?: number;
    user_ratings_total?: number;
  };
  error_message?: string;
}

/**
 * Search for places using Google Places API (Text Search)
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

    const data = await response.json() as GooglePlacesTextSearchResponse;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(ERROR_MESSAGES.API_KEY_INVALID);
      }
      throw new Error(`Places API Error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
    }

    // Map results to our schema
    const results: Lead[] = data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      city,  // Crucial for filtering
      state, // Crucial for filtering
      category: place.types?.[0] || 'unknown',
      phone: place.formatted_phone_number || undefined,
      rating: place.rating || undefined,
      user_ratings_total: place.user_ratings_total || undefined,
      status: 'NEW',
      notes: [],
      website: undefined,
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
    const url = `/api/google/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,formatted_address,geometry,types,website,rating,user_ratings_total&key=${key}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as GooglePlaceDetailsResponse;

    if (data.status === 'OK') {
      return {
        place_id: data.result.place_id,
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        formatted_phone_number: data.result.formatted_phone_number,
        international_phone_number: data.result.international_phone_number,
        website: data.result.website,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        phone: data.result.formatted_phone_number || undefined
      };
    }

    throw new Error(`Details API Error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}
