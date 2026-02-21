import { useState, useRef, useCallback } from 'react';
import type { Lead, Category } from '../types';
import { searchPlaces, sleep } from '../services/placesService';
import { PAGINATION_DELAY_MS } from '../constants';

/**
 * Hook para gerenciar a lógica de busca de leads via Google Places API.
 * Usa AbortController para cancelamento real de requisições em andamento.
 */
export const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Para a busca em andamento — aborta requisições HTTP em voo
   */
  const stopSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Busca leads para uma categoria em um bairro específico (ou cidade toda),
   * com paginação e enriquecimento de detalhes.
   */
  const searchCategoryInArea = async (
    selectedCity: string,
    selectedState: string,
    cat: Category,
    neighborhood: string | null,
    apiKey: string,
    maxLeads: number,
    seenPlaceIds: Set<string>,
    signal: AbortSignal,
    onLeadsFound?: (leads: Lead[]) => void
  ): Promise<{ leads: Lead[]; found: number }> => {
    let pageToken: string | null = null;
    let count = 0;
    const leads: Lead[] = [];
    let found = 0;

    const areaLabel = neighborhood ? `${cat.label} - ${neighborhood}` : cat.label;

    do {
      if (signal.aborted) break;

      let response;
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        try {
          response = await searchPlaces(
            selectedCity,
            selectedState,
            cat.query,
            pageToken,
            apiKey,
            neighborhood,
            signal
          );
          break; // Sucesso, sai do loop de retry
        } catch (error: any) {
          if (signal.aborted) throw error;

          retryCount++;
          if (retryCount <= maxRetries) {
            setSearchStatus(`${areaLabel}: Erro na busca, tentando novamente (${retryCount}/${maxRetries})...`);
            try {
              await sleep(2000, signal);
            } catch (e) {
              if (signal.aborted) throw error;
            }
          } else {
            console.error(`Falha definitiva ao buscar ${areaLabel}:`, error);
            setSearchStatus(`${areaLabel}: Erro persistente. Pulando para próxima área...`);
            try {
              await sleep(1500, signal); // Dar tempo para ler o status
            } catch (e) { }
            return { leads, found }; // Retorna o que já tem e "pula" esta área
          }
        }
      }

      if (!response) break;
      const { results, next_page_token } = response;

      found += results.length;

      const leadsBeforePage = leads.length;
      for (const lead of results) {
        if (signal.aborted) break;
        if (count >= maxLeads) break;

        // Deduplicar por place_id (entre bairros diferentes)
        if (seenPlaceIds.has(lead.place_id)) continue;
        seenPlaceIds.add(lead.place_id);

        const enrichedLead: Lead = {
          ...lead,
          category: cat.label,
          categoryId: cat.id,
          city: selectedCity,
          state: selectedState,
        };

        leads.push(enrichedLead);
        count++;

        setSearchStatus(`${areaLabel}: ${count}/${maxLeads} leads`);
      }

      // Notifica o chamador assim que uma página de resultados é processada (Salvamento Incremental + Progresso)
      const pageLeads = leads.slice(leadsBeforePage);
      if (onLeadsFound && pageLeads.length > 0) {
        onLeadsFound(pageLeads);
      }

      if (count >= maxLeads) break;

      pageToken = next_page_token || null;

      if (pageToken && !signal.aborted) {
        try {
          await sleep(PAGINATION_DELAY_MS, signal);
        } catch (e) {
          if (signal.aborted) break;
        }
      }
    } while (pageToken && !signal.aborted && count < maxLeads);

    return { leads, found };
  };

  /**
   * Realiza a busca de leads nas categorias especificadas
   */
  const handleSearch = async (
    selectedState: string,
    selectedCity: string,
    selectedNeighborhoods: string[],
    categories: Category[],
    apiKey: string,
    maxLeadsPerCategory: number,
    targetCategoryId: string | null = null,
    onLeadsFound?: (leads: Lead[]) => void
  ): Promise<{ success: boolean; newLeads: Lead[]; message: string; wasStopped: boolean }> => {
    // Validação de entrada
    if (!selectedState || !selectedCity) {
      return {
        success: false,
        newLeads: [],
        message: 'Por favor, selecione um estado e uma cidade primeiro.',
        wasStopped: false
      };
    }

    // Abortar busca anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController para esta busca
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setIsSearching(true);

    let totalFound = 0;
    let totalAdded = 0;
    const allNewLeads: Lead[] = [];

    try {
      // Determinar quais categorias buscar
      const catsToSearch = targetCategoryId
        ? categories.filter(c => c.id === targetCategoryId)
        : categories;

      // Determinar áreas de busca: bairros selecionados ou cidade toda
      const areas: (string | null)[] = selectedNeighborhoods.length > 0
        ? selectedNeighborhoods
        : [null]; // null = cidade inteira

      // Buscar em cada categoria
      for (const cat of catsToSearch) {
        if (signal.aborted) break;

        const categoryLeads: Lead[] = [];
        const seenPlaceIds = new Set<string>();

        setSearchStatus(`Buscando ${cat.label}...`);

        // Iterar por cada área (bairro ou cidade toda)
        for (const area of areas) {
          if (signal.aborted) break;
          if (categoryLeads.length >= maxLeadsPerCategory) break;

          const remaining = maxLeadsPerCategory - categoryLeads.length;

          const { leads, found } = await searchCategoryInArea(
            selectedCity,
            selectedState,
            cat,
            area,
            apiKey,
            remaining,
            seenPlaceIds,
            signal,
            onLeadsFound
          );

          categoryLeads.push(...leads);
          totalFound += found;

          // Removido o salvamento incremental aqui pois agora acontece dentro de searchCategoryInArea
          /*
          if (onLeadsFound && leads.length > 0) {
            onLeadsFound(leads);
          }
          */

          // Delay entre bairros
          if (area !== areas[areas.length - 1] && !signal.aborted) {
            try {
              await sleep(500, signal);
            } catch (e) {
              if (signal.aborted) break;
            }
          }
        }

        totalAdded += categoryLeads.length;
        allNewLeads.push(...categoryLeads);

        // Delay entre categorias
        if (!signal.aborted && catsToSearch.indexOf(cat) < catsToSearch.length - 1) {
          try {
            await sleep(500, signal);
          } catch (e) {
            if (signal.aborted) break;
          }
        }
      }

      // Montar mensagem de resultado
      const wasStopped = signal.aborted;
      let message = '';
      if (wasStopped) {
        message = `Busca interrompida. ${totalAdded} novos leads adicionados de ${totalFound} encontrados.`;
      } else {
        message = `Varredura concluída! ${totalAdded} novos leads adicionados de ${totalFound} encontrados.`;
      }

      return {
        success: true,
        newLeads: allNewLeads,
        message,
        wasStopped
      };
    } catch (error) {
      // Se foi abortado pelo usuário, não é um erro real
      if (signal.aborted) {
        return {
          success: true,
          newLeads: allNewLeads,
          message: `Busca interrompida. ${totalAdded} novos leads adicionados de ${totalFound} encontrados.`,
          wasStopped: true
        };
      }

      console.error('Error during search:', error);
      return {
        success: false,
        newLeads: allNewLeads,
        message: `Erro ao realizar varredura: ${error instanceof Error ? error.message : String(error)}`,
        wasStopped: false
      };
    } finally {
      setIsSearching(false);
      setSearchStatus('');
      abortControllerRef.current = null;
    }
  };

  return {
    isSearching,
    searchStatus,
    handleSearch,
    stopSearch
  };
};
