import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPlaces, getPlaceDetails, sleep } from '../placesService';

// Mock global fetch
global.fetch = vi.fn();

describe('placesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchPlaces', () => {
    it('should return places on successful search', async () => {
      const mockResponse = {
        places: [
          {
            id: 'test-place-1',
            displayName: { text: 'Test Restaurant' },
            formattedAddress: '123 Test St, São Paulo, SP',
            location: { latitude: -23.5505, longitude: -46.6333 },
            types: ['restaurant'],
            rating: 4.5,
            userRatingCount: 100,
            nationalPhoneNumber: '(11) 1234-5678',
            websiteUri: 'https://test.com'
          },
          {
            id: 'test-place-2',
            displayName: { text: 'Another Restaurant' },
            formattedAddress: '456 Test Ave, São Paulo, SP',
            location: { latitude: -23.5506, longitude: -46.6334 },
            types: ['restaurant'],
            rating: 4.0,
            userRatingCount: 50
          }
        ],
        nextPageToken: 'next-token-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key');

      expect(result.results).toHaveLength(2);
      expect(result.results[0].place_id).toBe('test-place-1');
      expect(result.results[0].name).toBe('Test Restaurant');
      expect(result.results[0].city).toBe('São Paulo');
      expect(result.results[0].state).toBe('SP');
      expect(result.results[0].status).toBe('NEW');
      expect(result.results[0].phone).toBe('(11) 1234-5678');
      expect(result.results[0].website).toBe('https://test.com');
      expect(result.nextPageToken).toBe('next-token-123');
    });

    it('should send POST request with correct headers and body', async () => {
      const mockResponse = { places: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/google/v1/places:searchText',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': 'test-api-key',
            'X-Goog-FieldMask': expect.stringContaining('places.id'),
          }),
          body: expect.stringContaining('restaurante em São Paulo, SP, Brasil'),
        })
      );
    });

    it('should handle pagination with pageToken', async () => {
      const mockResponse = { places: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', 'page-token-123', 'test-api-key');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.pageToken).toBe('page-token-123');
    });

    it('should include neighborhood in query when provided', async () => {
      const mockResponse = { places: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key', 'Centro');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.textQuery).toContain('Centro');
    });

    it('should throw error on HTTP 403 (invalid API key)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      await expect(
        searchPlaces('São Paulo', 'SP', 'restaurante', null, 'invalid-key')
      ).rejects.toThrow(/API Key inválida ou sem permissão/);
    });

    it('should handle empty results (no places key)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const result = await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key');

      expect(result.results).toEqual([]);
      expect(result.nextPageToken).toBeNull();
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key')
      ).rejects.toThrow('API Error: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key')
      ).rejects.toThrow('Network error');
    });
  });

  describe('getPlaceDetails', () => {
    it('should return place details on success', async () => {
      const mockResponse = {
        id: 'test-place-1',
        displayName: { text: 'Test Restaurant' },
        formattedAddress: '123 Test St, São Paulo, SP',
        nationalPhoneNumber: '(11) 1234-5678',
        internationalPhoneNumber: '+55 11 1234-5678',
        websiteUri: 'https://test-restaurant.com',
        location: { latitude: -23.5505, longitude: -46.6333 },
        types: ['restaurant'],
        rating: 4.5,
        userRatingCount: 100
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getPlaceDetails('test-place-1', 'test-api-key');

      expect(result.place_id).toBe('test-place-1');
      expect(result.name).toBe('Test Restaurant');
      expect(result.formatted_phone_number).toBe('(11) 1234-5678');
      expect(result.website).toBe('https://test-restaurant.com');
      expect(result.phone).toBe('(11) 1234-5678');
    });

    it('should handle HTTP 404 errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        getPlaceDetails('invalid-place-id', 'test-api-key')
      ).rejects.toThrow('API Error: 404');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        getPlaceDetails('test-place-1', 'test-api-key')
      ).rejects.toThrow('API Error: 500');
    });

    it('should include field mask in headers', async () => {
      const mockResponse = {
        id: 'test-place-1',
        displayName: { text: 'Test' }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await getPlaceDetails('test-place-1', 'test-api-key');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/google/v1/places/test-place-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Goog-Api-Key': 'test-api-key',
            'X-Goog-FieldMask': expect.stringContaining('displayName'),
          }),
        })
      );
    });
  });

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90); // Allow small margin
      expect(end - start).toBeLessThan(150);
    });

    it('should resolve without value', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });
});
