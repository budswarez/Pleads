import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../useStore';
import type { Lead } from '../../types';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.setState({
      locations: [],
      leads: [],
      selectedState: null,
      selectedCity: null,
      selectedNeighborhoods: [],
    });
  });

  describe('Location Management', () => {
    it('should add a new location', () => {
      const { addLocation } = useStore.getState();
      const result = addLocation('São Paulo', 'SP');

      expect(result).toBe(true);
      const { locations } = useStore.getState();
      expect(locations).toHaveLength(1);
      expect(locations[0]).toMatchObject({
        city: 'São Paulo',
        state: 'SP'
      });
      expect(locations[0].id).toBeDefined();
    });

    it('should not add duplicate locations (case insensitive)', () => {
      const { addLocation } = useStore.getState();
      addLocation('São Paulo', 'SP');
      const result = addLocation('são paulo', 'sp');

      expect(result).toBe(false);
      expect(useStore.getState().locations).toHaveLength(1);
    });

    it('should store location exactly as provided', () => {
      const { addLocation } = useStore.getState();
      addLocation('Rio de Janeiro', 'RJ');

      const { locations } = useStore.getState();
      expect(locations[0].city).toBe('Rio de Janeiro');
      expect(locations[0].state).toBe('RJ');
    });

    it('should remove a location by id', () => {
      const { addLocation, removeLocation } = useStore.getState();
      addLocation('São Paulo', 'SP');
      const locationId = useStore.getState().locations[0].id;

      removeLocation(locationId);
      expect(useStore.getState().locations).toHaveLength(0);
    });

    it('should get unique states', () => {
      const { addLocation, getStates } = useStore.getState();
      addLocation('São Paulo', 'SP');
      addLocation('Campinas', 'SP');
      addLocation('Rio de Janeiro', 'RJ');

      const states = getStates();
      expect(states).toEqual(['RJ', 'SP']);
    });

    it('should get cities by state', () => {
      const { addLocation, getCitiesByState } = useStore.getState();
      addLocation('São Paulo', 'SP');
      addLocation('Campinas', 'SP');
      addLocation('Rio de Janeiro', 'RJ');

      const spCities = getCitiesByState('SP');
      expect(spCities).toEqual(['Campinas', 'São Paulo']);

      const rjCities = getCitiesByState('RJ');
      expect(rjCities).toEqual(['Rio de Janeiro']);
    });
  });

  describe('Lead Management', () => {
    const createMockLead = (placeId: string, overrides?: Partial<Lead>): Lead => ({
      place_id: placeId,
      name: `Lead ${placeId}`,
      address: '123 Test St',
      city: 'São Paulo',
      state: 'SP',
      status: 'NEW',
      notes: [],
      ...overrides
    });

    it('should add new leads and return count', () => {
      const { addLeads } = useStore.getState();
      const leads = [
        createMockLead('1'),
        createMockLead('2')
      ];

      const addedCount = addLeads(leads);
      expect(addedCount).toBe(2);
      expect(useStore.getState().leads).toHaveLength(2);
    });

    it('should not add duplicate leads by place_id', () => {
      const { addLeads } = useStore.getState();
      const lead = createMockLead('1');

      addLeads([lead]);
      const addedCount = addLeads([lead]);

      expect(addedCount).toBe(0);
      expect(useStore.getState().leads).toHaveLength(1);
    });

    it('should filter leads by location', () => {
      const { addLeads, setSelectedState, setSelectedCity, getFilteredLeads } = useStore.getState();
      addLeads([
        createMockLead('1', { city: 'São Paulo', state: 'SP' }),
        createMockLead('2', { city: 'Rio de Janeiro', state: 'RJ' })
      ]);

      setSelectedState('SP');
      setSelectedCity('São Paulo');

      const filtered = getFilteredLeads();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].place_id).toBe('1');
    });

    it('should return empty array when no location selected', () => {
      const { addLeads, getFilteredLeads } = useStore.getState();
      addLeads([createMockLead('1')]);

      const filtered = getFilteredLeads();
      expect(filtered).toEqual([]);
    });

    it('should update lead status', () => {
      const { addLeads, updateLeadStatus } = useStore.getState();
      addLeads([createMockLead('1', { status: 'NEW' })]);

      updateLeadStatus('1', 'CONTACTED');

      const { leads } = useStore.getState();
      expect(leads[0].status).toBe('CONTACTED');
    });

    it('should update lead notes', () => {
      const { addLeads, updateLeadNotes } = useStore.getState();
      addLeads([createMockLead('1')]);

      updateLeadNotes('1', 'First note');
      let { leads } = useStore.getState();
      expect(leads[0].notes).toHaveLength(1);
      expect(leads[0].notes![0].text).toBe('First note');

      updateLeadNotes('1', 'Second note');
      leads = useStore.getState().leads;
      expect(leads[0].notes).toHaveLength(2);
      expect(leads[0].notes![1].text).toBe('Second note');
    });

    it('should clear all leads when onlySelected is false', () => {
      const { addLeads, clearLeads } = useStore.getState();
      addLeads([
        createMockLead('1', { city: 'São Paulo', state: 'SP' }),
        createMockLead('2', { city: 'Rio de Janeiro', state: 'RJ' })
      ]);

      clearLeads(false);
      expect(useStore.getState().leads).toHaveLength(0);
    });

    it('should clear only selected location leads when onlySelected is true', () => {
      const { addLeads, clearLeads, setSelectedState, setSelectedCity } = useStore.getState();
      addLeads([
        createMockLead('1', { city: 'São Paulo', state: 'SP' }),
        createMockLead('2', { city: 'Rio de Janeiro', state: 'RJ' })
      ]);

      setSelectedState('SP');
      setSelectedCity('São Paulo');
      clearLeads(true);

      const { leads } = useStore.getState();
      expect(leads).toHaveLength(1);
      expect(leads[0].place_id).toBe('2');
    });

    it('should remove leads by category in selected location', () => {
      const { addLeads, removeLeadsByCategory, setSelectedState, setSelectedCity } = useStore.getState();
      addLeads([
        createMockLead('1', { categoryId: 'restaurant', city: 'São Paulo', state: 'SP' }),
        createMockLead('2', { categoryId: 'pharmacy', city: 'São Paulo', state: 'SP' })
      ]);

      setSelectedState('SP');
      setSelectedCity('São Paulo');
      removeLeadsByCategory('restaurant');

      const { leads } = useStore.getState();
      expect(leads).toHaveLength(1);
      expect(leads[0].place_id).toBe('2');
    });
  });

  describe('Status Management', () => {
    it('should add a new status', () => {
      const { addStatus, statuses } = useStore.getState();
      const initialLength = statuses.length;

      addStatus('Priority', '#ff0000');

      const updatedStatuses = useStore.getState().statuses;
      expect(updatedStatuses).toHaveLength(initialLength + 1);
      expect(updatedStatuses[updatedStatuses.length - 1]).toMatchObject({
        label: 'Priority',
        color: '#ff0000'
      });
    });

    it('should remove a status by id', () => {
      const { addStatus, removeStatus } = useStore.getState();
      addStatus('Test Status', '#000000');

      const statusId = useStore.getState().statuses[useStore.getState().statuses.length - 1].id;
      removeStatus(statusId);

      const { statuses } = useStore.getState();
      expect(statuses.find(s => s.id === statusId)).toBeUndefined();
    });
  });

  describe('Category Management', () => {
    it('should add a new category', () => {
      const { addCategory, categories } = useStore.getState();
      const initialLength = categories.length;

      addCategory('Bakeries', 'bakery');

      const updatedCategories = useStore.getState().categories;
      expect(updatedCategories).toHaveLength(initialLength + 1);
      expect(updatedCategories[updatedCategories.length - 1]).toMatchObject({
        label: 'Bakeries',
        query: 'bakery'
      });
    });

    it('should remove a category by id', () => {
      const { addCategory, removeCategory } = useStore.getState();
      addCategory('Test Category', 'test');

      const categoryId = useStore.getState().categories[useStore.getState().categories.length - 1].id;
      removeCategory(categoryId);

      const { categories } = useStore.getState();
      expect(categories.find(c => c.id === categoryId)).toBeUndefined();
    });
  });

  describe('API Key Management', () => {
    it('should set and get API key', () => {
      const { setApiKey, getApiKey } = useStore.getState();
      const testKey = 'test-api-key-123';

      setApiKey(testKey);
      expect(getApiKey()).toBe(testKey);
    });
  });

  describe('Supabase Configuration', () => {
    it('should set Supabase config', () => {
      const { setSupabaseConfig } = useStore.getState();
      const testUrl = 'https://test.supabase.co';
      const testKey = 'test-key';

      setSupabaseConfig(testUrl, testKey);

      const { supabaseUrl, supabaseAnonKey } = useStore.getState();
      expect(supabaseUrl).toBe(testUrl);
      expect(supabaseAnonKey).toBe(testKey);
    });

    it('should set connection status', () => {
      const { setSupabaseConnected } = useStore.getState();

      setSupabaseConnected(true);
      expect(useStore.getState().supabaseConnected).toBe(true);

      setSupabaseConnected(false);
      expect(useStore.getState().supabaseConnected).toBe(false);
    });

    it('should get Supabase config', () => {
      const { setSupabaseConfig, setSupabaseConnected, getSupabaseConfig } = useStore.getState();

      setSupabaseConfig('https://test.supabase.co', 'test-key');
      setSupabaseConnected(true);

      const config = getSupabaseConfig();
      expect(config).toEqual({
        url: 'https://test.supabase.co',
        anonKey: 'test-key',
        connected: true
      });
    });
  });

  describe('Branding Configuration', () => {
    it('should set branding', () => {
      const { setBranding } = useStore.getState();

      setBranding('My App', 'My Description', 'https://logo.png');

      const { appTitle, appDescription, appLogoUrl } = useStore.getState();
      expect(appTitle).toBe('My App');
      expect(appDescription).toBe('My Description');
      expect(appLogoUrl).toBe('https://logo.png');
    });

    it('should set max leads per category', () => {
      const { setMaxLeadsPerCategory } = useStore.getState();

      setMaxLeadsPerCategory(100);
      expect(useStore.getState().maxLeadsPerCategory).toBe(100);
    });
  });

  describe('Data Sync', () => {
    it('should get all data for sync', () => {
      const { addLocation, addLeads, getAllDataForSync } = useStore.getState();

      addLocation('São Paulo', 'SP');
      addLeads([createMockLead('1')]);

      const data = getAllDataForSync();
      expect(data).toHaveProperty('leads');
      expect(data).toHaveProperty('locations');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('statuses');
      expect(data.leads).toHaveLength(1);
      expect(data.locations).toHaveLength(1);
    });

    it('should load data from Supabase', () => {
      const { loadFromSupabase } = useStore.getState();

      const mockData = {
        leads: [createMockLead('1')],
        locations: [{ id: 1, city: 'Test City', state: 'TC', neighborhoods: [] }],
        statuses: [{ id: 'TEST', label: 'Test Status', color: '#000000' }],
        categories: [{ id: 'test', label: 'Test Category', query: 'test' }]
      };

      loadFromSupabase(mockData);

      const { leads, locations, statuses, categories } = useStore.getState();
      expect(leads).toHaveLength(1);
      expect(locations).toHaveLength(1);
      expect(statuses.some(s => s.id === 'TEST')).toBe(true);
      expect(categories.some(c => c.id === 'test')).toBe(true);
    });
  });

  const createMockLead = (placeId: string, overrides?: Partial<Lead>): Lead => ({
    place_id: placeId,
    name: `Lead ${placeId}`,
    address: '123 Test St',
    city: 'São Paulo',
    state: 'SP',
    status: 'NEW',
    notes: [],
    ...overrides
  });
});
