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
export interface LocationSlice {
  // Data
  locations: Location[];

  // Selection
  selectedState: string | null;
  selectedCity: string | null;
  selectedNeighborhoods: string[];

  // Management Methods
  addLocation: (city: string, state: string) => Promise<boolean>;
  removeLocation: (id: number) => Promise<void>;
  getStates: () => string[];
  getCitiesByState: (state: string) => string[];

  // Selection Methods
  setSelectedState: (state: string | null) => void;
  setSelectedCity: (city: string | null) => void;
  setSelectedNeighborhoods: (neighborhoods: string[]) => void;

  // Neighborhood Management Methods
  updateLocationNeighborhoods: (locationId: number, neighborhoods: string[]) => Promise<void>;
  getNeighborhoodsByLocation: (city: string, state: string) => string[];
}

export interface LeadSlice {
  // Data
  leads: Lead[];

  // Lead Management Methods
  addLeads: (leads: Lead[]) => Promise<number>;
  clearLeads: (onlySelected?: boolean) => Promise<void>;
  removeLeadsByCategory: (categoryId: string) => Promise<void>;
  updateLeadStatus: (placeId: string, status: string) => Promise<void>;
  updateLeadNotes: (placeId: string, noteText: string) => Promise<void>;
  deleteLeadNote: (placeId: string, noteId: number) => Promise<void>;
  removeLead: (placeId: string) => Promise<void>;
  getFilteredLeads: () => Lead[];
}

export interface StatusCategorySlice {
  // Data
  statuses: Status[];
  categories: Category[];

  // Status Management Methods
  addStatus: (label: string, color: string) => Promise<void>;
  removeStatus: (id: string) => Promise<void>;
  updateStatus: (id: string, updates: Partial<Status>) => Promise<void>;

  // Category Management Methods
  addCategory: (label: string, query: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
}

export interface ConfigSlice {
  // Configuration Data
  apiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseConnected: boolean;
  appTitle: string;
  appDescription: string;
  appLogoUrl: string;
  maxLeadsPerCategory: number;
  leadsPerPage: number;

  // Configuration Methods
  setApiKey: (key: string) => Promise<void>;
  getApiKey: () => string;
  setSupabaseConfig: (url: string, anonKey: string) => Promise<void>;
  setSupabaseConnected: (connected: boolean) => void;
  getSupabaseConfig: () => { url: string; anonKey: string; connected: boolean };
  setBranding: (title: string, description: string, logoUrl: string) => Promise<void>;
  setMaxLeadsPerCategory: (max: number) => Promise<void>;
  setLeadsPerPage: (n: number) => Promise<void>;

  // Sync Methods
  getAllDataForSync: () => {
    leads: Lead[];
    locations: Location[];
    categories: Category[];
    statuses: Status[];
  };
  loadFromSupabase: (data: {
    leads?: Lead[];
    locations?: Location[];
    categories?: Category[];
    statuses?: Status[];
    settings?: any;
  }) => void;
}

/**
 * Zustand store state interface combining all slices
 */
export type StoreState = LocationSlice & LeadSlice & StatusCategorySlice & ConfigSlice;

/**
 * Google Places API response types
 */
export interface PlacesSearchResult {
  place_id: string;
  name: string;
  address: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  phone?: string;
  website?: string;
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
  settings: boolean;
}

export interface AppSettings {
  id: number;
  app_title: string;
  app_description: string;
  app_logo_url: string;
  max_leads_per_category: number;
  leads_per_page: number;
  google_api_key: string;
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
