/// <reference types="vite/client" />

/**
 * Type definitions for environment variables
 * These are accessed via import.meta.env in Vite
 */
interface ImportMetaEnv {
  /**
   * Google Places API Key
   * Get from: https://console.cloud.google.com/
   */
  readonly VITE_GOOGLE_PLACES_KEY: string;

  /**
   * Supabase Project URL
   * Format: https://[project-id].supabase.co
   * Get from: https://app.supabase.com/ -> Settings -> API
   */
  readonly VITE_SUPABASE_URL: string;

  /**
   * Supabase Anonymous Key (anon/public key)
   * DO NOT use service_role key here
   * Get from: https://app.supabase.com/ -> Settings -> API
   */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
