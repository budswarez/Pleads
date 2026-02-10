/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

import { Status } from '../types';

/**
 * Google Places API Configuration
 */
export const GOOGLE_RESULTS_PER_PAGE = 20;
export const PAGINATION_DELAY_MS = 2000;

/**
 * Lead Management Configuration
 */
export const DEFAULT_MAX_LEADS_PER_CATEGORY = 60;
export const MAX_NOTE_LENGTH = 5000;

/**
 * UI Configuration
 */
export const NOTIFICATION_TIMEOUT_MS = 2000;
export const MODAL_OVERLAY_CLASS = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50';

/**
 * Default Status Colors and Labels
 * These are the initial statuses when the app is first used
 */
export const DEFAULT_STATUSES: readonly Status[] = [
  { id: 'NEW', label: 'Novo', color: '#eab308' },
  { id: 'CONTACTED', label: 'Em contato', color: '#3b82f6' },
  { id: 'CLIENT', label: 'Cliente', color: '#22c55e' },
  { id: 'REFUSED', label: 'Recusado', color: '#ef4444' }
] as const;

/**
 * Validation Constants
 */
export const MIN_PHONE_LENGTH = 8;
export const MAX_PHONE_LENGTH = 15;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Supabase Table Names
 */
export const SUPABASE_TABLES = {
  LEADS: 'leads',
  LOCATIONS: 'locations',
  CATEGORIES: 'categories',
  STATUSES: 'statuses'
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  PLEADS_STORE: 'pleads-storage'
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'API Key do Google Places não configurada. Acesse Configurações para adicionar sua chave.',
  API_KEY_INVALID: 'API Key inválida ou sem permissão. Verifique suas configurações no Google Cloud Console.',
  SUPABASE_NOT_INITIALIZED: 'Cliente Supabase não inicializado. Configure suas credenciais primeiro.',
  SUPABASE_CONNECTION_FAILED: 'Falha ao conectar com o Supabase. Verifique suas credenciais.',
  LOCATION_NOT_SELECTED: 'Por favor, selecione um estado e uma cidade primeiro.',
  NO_RESULTS_FOUND: 'Nenhum resultado encontrado para esta busca.',
  SEARCH_ERROR: 'Erro ao realizar varredura',
  NETWORK_ERROR: 'Erro de rede. Verifique sua conexão.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Tente novamente.'
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  SEARCH_COMPLETE: 'Varredura concluída com sucesso',
  DATA_SAVED: 'Dados salvos com sucesso',
  SYNC_COMPLETE: 'Sincronização concluída',
  LOCATION_ADDED: 'Localização adicionada com sucesso',
  CATEGORY_ADDED: 'Categoria adicionada com sucesso',
  STATUS_ADDED: 'Status adicionado com sucesso'
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  GOOGLE_PLACES_SEARCH: '/api/google/search',
  GOOGLE_PLACES_DETAILS: '/api/google/details'
} as const;

/**
 * Regular Expressions
 */
export const REGEX_PATTERNS = {
  GOOGLE_API_KEY: /^AIza[0-9A-Za-z_-]{35}$/,
  SUPABASE_URL: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_DIGITS: /\D/g,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
} as const;

/**
 * Default Categories
 * Initial categories when the app is first used
 */
export const DEFAULT_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurantes', query: 'restaurante' },
  { id: 'gas_station', label: 'Postos de Gasolina', query: 'posto de gasolina' },
  { id: 'convenience_store', label: 'Lojas de Conveniência', query: 'loja de conveniencia' }
] as const;

/**
 * Branding Defaults
 */
export const DEFAULT_BRANDING = {
  TITLE: 'Pichau Energy Leads',
  DESCRIPTION: 'Sistema de Gerenciamento de Leads e Prospecção',
  LOGO_URL: '/logo.png'
} as const;
