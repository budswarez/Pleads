import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPlaces, sleep } from '../placesService';

// Mock global fetch
// global.fetch = vi.fn(); // Removido para evitar poluição global persistente

describe('placesService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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
      expect((result.results[0] as any).city).toBe('São Paulo');
      expect((result.results[0] as any).state).toBe('SP');
      expect((result.results[0] as any).status).toBe('NEW');
      expect(result.results[0].phone).toBe('(11) 1234-5678');
      expect(result.results[0].website).toBe('https://test.com');
      expect((result as any).nextPageToken).toBe('next-token-123');
    });

    it('should send POST request with correct headers (API key via X-Api-Key)', async () => {
      const mockResponse = { places: [] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await searchPlaces('São Paulo', 'SP', 'restaurante', null, 'test-api-key');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/places-search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Api-Key': 'test-api-key',
            'X-Goog-FieldMask': expect.stringContaining('places.id'),
          }),
          body: expect.stringContaining('restaurante em São Paulo, SP, Brasil'),
        })
      );

      // Não deve enviar X-Goog-Api-Key diretamente (o proxy faz isso)
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-Goog-Api-Key']).toBeUndefined();
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
      expect((result as any).nextPageToken).toBeNull();
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

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const promise = sleep(100);
      await vi.advanceTimersByTimeAsync(100);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve without value', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });
});
