import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState } from '../types';
import { STORAGE_KEYS } from '../constants';
import { createLocationSlice } from './slices/locationSlice';
import { createLeadSlice } from './slices/leadSlice';
import { createStatusCategorySlice } from './slices/statusCategorySlice';
import { createConfigSlice } from './slices/configSlice';

const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createLocationSlice(set, get, api),
      ...createLeadSlice(set, get, api),
      ...createStatusCategorySlice(set, get, api),
      ...createConfigSlice(set, get, api),
    }),
    {
      name: STORAGE_KEYS.PLEADS_STORE,
      partialize: (state) => {
        // Exclui chaves de API e configurações de Supabase da persistência
        // para que elas sempre sejam lidas do .env no carregamento
        const { apiKey, supabaseUrl, supabaseAnonKey, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useStore;
