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
 * Fetch neighborhoods for a city using OpenStreetMap (Overpass API) - Primary Source
 */
export const fetchNeighborhoodsFromOSM = async (
  city: string,
  state: string
): Promise<string[]> => {
  const cleanCity = city.trim();

  // Query Overpass QL:
  // 1. Busca áreas com o nome da cidade (case-insensitive)
  // 2. Filtra por admin_level=8 (Município) para evitar estados/províncias (ex: Laguna nas Filipinas)
  // 3. Tenta garantir que seja do tipo administrativo
  const query = `
    [out:json][timeout:30];
    area["name"~"^${cleanCity}$",i]["admin_level"="8"]["boundary"="administrative"]->.a;
    (
      node["place"~"suburb|neighbourhood|sublocality"](area.a);
      way["place"~"suburb|neighbourhood|sublocality"](area.a);
      rel["place"~"suburb|neighbourhood|sublocality"](area.a);
    );
    out tags;
  `.trim();

  try {
    console.log(`[OSM] Buscando bairros para: ${cleanCity} (${state})`);

    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Fallback: Se não achou com admin_level=8, tenta sem a restrição de nível (menos seguro, mas abrangente)
    if (!data.elements || data.elements.length === 0) {
      console.log(`[OSM] Nenhum resultado com admin_level=8, tentando busca relaxada...`);
      const relaxedQuery = `
        [out:json][timeout:25];
        area["name"~"^${cleanCity}$",i]->.a;
        (
          node["place"~"suburb|neighbourhood|sublocality"](area.a);
          way["place"~"suburb|neighbourhood|sublocality"](area.a);
          rel["place"~"suburb|neighbourhood|sublocality"](area.a);
        );
        out tags;
      `.trim();

      const relaxedResponse = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(relaxedQuery)}`, {
        method: 'GET'
      });

      if (relaxedResponse.ok) {
        const relaxedData = await relaxedResponse.json();
        data.elements = relaxedData.elements || [];
      }
    }

    console.log(`[OSM] Elementos brutos recebidos:`, data.elements?.length || 0);

    if (!data.elements || data.elements.length === 0) {
      return [];
    }

    const neighborhoods = data.elements
      .map((el: any) => el.tags?.name)
      .filter((name: string | undefined) => {
        if (!name) return false;
        const nLower = name.toLowerCase().trim();
        const cityLower = cleanCity.toLowerCase();
        // Evita que o nome da própria cidade ou do estado apareça como bairro
        return nLower !== cityLower &&
          nLower !== state.toLowerCase() &&
          !nLower.includes(`bairros de ${cityLower}`);
      })
      .sort() as string[];

    return [...new Set(neighborhoods)];
  } catch (error) {
    console.warn('[OSM] Erro na busca:', error);
    return [];
  }
};

/**
 * Fetch neighborhoods for a city using Google Places API - Fallback Source
 */
export const fetchNeighborhoodsFromGoogle = async (
  city: string,
  state: string,
  apiKey: string
): Promise<string[]> => {
  const allNeighborhoodNames: string[] = [];
  let pageToken: string | null = null;
  let pagesFetched = 0;
  const maxPages = 2; // Reduzido para fallback mais rápido

  try {
    do {
      const textQuery = `bairros em ${city}, ${state}, Brasil`;
      console.log(`[Google] Tentando: ${textQuery} (Página ${pagesFetched + 1})`);

      const requestBody: any = {
        textQuery,
        pageSize: 20
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await fetch('/api/places-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': 'places.displayName,nextPageToken',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) break;

      const data = await response.json();
      const results = data.places || [];
      console.log(`[Google] Recebidos ${results.length} resultados.`);

      results.forEach((p: any) => {
        if (p.displayName?.text) {
          allNeighborhoodNames.push(p.displayName.text);
        }
      });

      pageToken = data.nextPageToken;
      pagesFetched++;

      if (pageToken && pagesFetched < maxPages) {
        await sleep(1500);
      }
    } while (pageToken && pagesFetched < maxPages);

    const cityLower = city.toLowerCase().trim();
    const filtered = allNeighborhoodNames
      .filter((n: string | undefined) => {
        if (!n) return false;
        const nLower = n.toLowerCase().trim();
        if (nLower === cityLower) return false;
        if (nLower.includes(`bairros de ${cityLower}`)) return false;
        if (nLower === `região de ${cityLower}`) return false;
        return true;
      })
      .map(n => n!.trim())
      .sort() as string[];

    return [...new Set(filtered)];
  } catch (error) {
    console.error('[Google] Erro no fallback:', error);
    return [];
  }
};

/**
 * Enhanced fetchNeighborhoods (OSM with Google Fallback)
 */
export const fetchNeighborhoods = async (
  city: string,
  state: string,
  apiKey: string
): Promise<string[]> => {
  console.group(`Descobrindo bairros: ${city}`);
  try {
    // 1. OSM
    const osmResults = await fetchNeighborhoodsFromOSM(city, state);
    if (osmResults.length > 5) {
      console.log(`✓ Usando ${osmResults.length} bairros do OSM.`);
      console.groupEnd();
      return osmResults;
    }

    // 2. Google Fallback
    console.log('! OSM insuficiente, tentando Google...');
    const googleResults = await fetchNeighborhoodsFromGoogle(city, state, apiKey);

    const final = googleResults.length > 0 ? googleResults : osmResults;
    console.log(`✓ Finalizado com ${final.length} bairros.`);
    console.groupEnd();
    return final;
  } catch (error) {
    console.error('! Falha total na descoberta:', error);
    console.groupEnd();
    return [];
  }
};