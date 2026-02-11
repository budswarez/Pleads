/**
 * Core type definitions for the PLeads application
 */

/**
 * Represents a location (city/state pair) to scan for businesses
 */
export interface Location {
  id: number;
  city: string;
  state: string;
  neighborhoods: string[];
}

/**
 * Represents a note attached to a lead
 */
export interface Note {
  id: number;
  text: string;
  date: string; // ISO 8601 date string
}

/**
 * Represents a business lead captured from Google Places
 */
export interface Lead {
  place_id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  category?: string;
  categoryId?: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  status?: string;
  notes?: Note[];
}

/**
 * Represents a status that can be assigned to leads
 */
export interface Status {
  id: string;
  label: string;
  color: string; // Hex color code (e.g., '#FF5733')
}

/**
 * Represents a business category for lead filtering and searching
 */
export interface Category {
  id: string;
  label: string;
  query: string; // Search query for Google Places API
}

/**
 * Zustand store state interface
 */
export interface StoreState {
  // Data
  locations: Location[];
  leads: Lead[];
  statuses: Status[];
  categories: Category[];

  // Selection
  selectedState: string | null;
  selectedCity: string | null;
  selectedNeighborhoods: string[];

  // Configuration
  apiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseConnected: boolean;
  appTitle: string;
  appDescription: string;
  appLogoUrl: string;
  maxLeadsPerCategory: number;

  // Location Management Methods
  addLocation: (city: string, state: string) => boolean;
  removeLocation: (id: number) => void;
  getStates: () => string[];
  getCitiesByState: (state: string) => string[];

  // Lead Management Methods
  addLeads: (leads: Lead[]) => number;
  clearLeads: (onlySelected?: boolean) => void;
  removeLeadsByCategory: (categoryId: string) => void;
  updateLeadStatus: (placeId: string, status: string) => void;
  updateLeadNotes: (placeId: string, noteText: string) => void;
  getFilteredLeads: () => Lead[];

  // Selection Methods
  setSelectedState: (state: string | null) => void;
  setSelectedCity: (city: string | null) => void;
  setSelectedNeighborhoods: (neighborhoods: string[]) => void;

  // Neighborhood Management Methods
  updateLocationNeighborhoods: (locationId: number, neighborhoods: string[]) => void;
  getNeighborhoodsByLocation: (city: string, state: string) => string[];

  // Status Management Methods
  addStatus: (label: string, color: string) => void;
  removeStatus: (id: string) => void;
  updateStatus: (id: string, updates: Partial<Status>) => void;

  // Category Management Methods
  addCategory: (label: string, query: string) => void;
  removeCategory: (id: string) => void;

  // Configuration Methods
  setApiKey: (key: string) => void;
  getApiKey: () => string;
  setSupabaseConfig: (url: string, anonKey: string) => void;
  setSupabaseConnected: (connected: boolean) => void;
  getSupabaseConfig: () => { url: string; anonKey: string; connected: boolean };
  setBranding: (title: string, description: string, logoUrl: string) => void;
  setMaxLeadsPerCategory: (max: number) => void;

  // Sync Methods
  getAllDataForSync: () => {
    leads: Lead[];
    locations: Location[];
    categories: Category[];
    statuses: Status[];
  };
  loadFromSupabase: (data: Partial<{
    leads: Lead[];
    locations: Location[];
    categories: Category[];
    statuses: Status[];
  }>) => void;
}

/**
 * Google Places API response types
 */
export interface PlacesSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

export interface PlacesSearchResponse {
  results: PlacesSearchResult[];
  status: string;
  next_page_token?: string;
  error_message?: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  phone?: string; // Processed/sanitized phone number
}

/**
 * Supabase service types
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseConnectionStatus {
  connected: boolean;
  error?: string;
  message?: string;
}

export interface SupabaseTableStatus {
  leads: boolean;
  locations: boolean;
  categories: boolean;
  statuses: boolean;
  user_profiles: boolean;
}

/**
 * Component prop types
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface StatusManagementModalProps extends ModalProps {
  statuses: Status[];
  addStatus: (label: string, color: string) => void;
  removeStatus: (id: string) => void;
}

export interface CategoryManagementModalProps extends ModalProps {
  categories: Category[];
  addCategory: (label: string, query: string) => void;
  removeCategory: (id: string) => void;
}

export interface LocationManagementModalProps extends ModalProps {
  // Modal uses store directly via useStore hook
}

export interface SettingsModalProps extends ModalProps {
  // Modal uses store directly via useStore hook
}

export interface LeadCardProps {
  lead: Lead;
  statuses: Status[];
  onStatusUpdate: (placeId: string, status: string) => void;
  onNotesUpdate: (placeId: string, notes: string) => void;
  getStatusColor: (statusId: string) => string;
  getStatusLabel: (statusId: string) => string;
}

/**
 * Hook return types
 */
export interface UseSearchReturn {
  isSearching: boolean;
  searchStatus: string;
  handleSearch: (
    selectedState: string,
    selectedCity: string,
    selectedNeighborhoods: string[],
    categories: Category[],
    apiKey: string,
    maxLeadsPerCategory: number
  ) => Promise<{
    success: boolean;
    newLeads: Lead[];
    message: string;
  }>;
}

export interface UseFilteredLeadsReturn {
  filteredLeads: Lead[];
  categoryCounts: Map<string, number>;
  statusCounts: Map<string, number>;
}

/**
 * User profile for authentication
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

/**
 * Validation types
 */
export type ValidationResult = {
  valid: boolean;
  error?: string;
};
