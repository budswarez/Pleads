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
        status: 'OK',
        results: [
          {
            place_id: 'test-place-1',
            name: 'Test Restaurant',
            formatted_address: '123 Test St, São Paulo, SP',
            geometry: {
              location: { lat: -23.5505, lng: -46.6333 }
            },
            types: ['restaurant'],
            rating: 4.5,
            user_ratings_total: 100
          },
          {
            place_id: 'test-place-2',
            name: 'Another Restaurant',
            formatted_address: '456 Test Ave, São Paulo, SP',
            geometry: {
              location: { lat: -23.5506, lng: -46.6334 }
            },
            types: ['restaurant'],
            rating: 4.0,
            user_ratings_total: 50
          }
        ],
        next_page_token: 'next-token-123'
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
      expect(result.nextPageToken).toBe('next-token-123');
    });

    it('should handle pagination with pageToken', async () => {
      const mockResponse = {
        status: 'OK',
        results: [],
        next_page_token: null
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', 'page-token-123', 'test-api-key');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pagetoken=page-token-123')
      );
    });

    it('should include neighborhood in query when provided', async () => {
      const mockResponse = {
        status: 'OK',
        results: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key', 'Centro');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Centro')
      );
    });

    it('should throw error on REQUEST_DENIED status', async () => {
      const mockResponse = {
        status: 'REQUEST_DENIED',
        error_message: 'Invalid API key'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(
        searchPlaces('São Paulo', 'SP', 'restaurante', null, 'invalid-key')
      ).rejects.toThrow(/API Key inválida ou sem permissão/);
    });

    it('should handle ZERO_RESULTS status', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
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
        status: 'OK',
        result: {
          place_id: 'test-place-1',
          name: 'Test Restaurant',
          formatted_address: '123 Test St, São Paulo, SP',
          formatted_phone_number: '(11) 1234-5678',
          international_phone_number: '+55 11 1234-5678',
          website: 'https://test-restaurant.com',
          geometry: {
            location: { lat: -23.5505, lng: -46.6333 }
          },
          types: ['restaurant'],
          rating: 4.5,
          user_ratings_total: 100
        }
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

    it('should handle API errors', async () => {
      const mockResponse = {
        status: 'NOT_FOUND',
        error_message: 'Place not found'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(
        getPlaceDetails('invalid-place-id', 'test-api-key')
      ).rejects.toThrow('Details API Error: NOT_FOUND');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        getPlaceDetails('test-place-1', 'test-api-key')
      ).rejects.toThrow('API Error: 404');
    });

    it('should include requested fields in URL', async () => {
      const mockResponse = {
        status: 'OK',
        result: {
          place_id: 'test-place-1',
          name: 'Test'
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await getPlaceDetails('test-place-1', 'test-api-key');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('fields=name,formatted_phone_number')
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
