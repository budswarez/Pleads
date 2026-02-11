import { useState, useRef } from 'react';
import type { Lead, Category } from '../types';
import { searchPlaces, getPlaceDetails, sleep } from '../services/placesService';
import { PAGINATION_DELAY_MS } from '../constants';

/**
 * Hook para gerenciar a lógica de busca de leads via Google Places API
 * @returns Objeto com estado de busca e função de busca
 */
export const useSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const stopSearchRef = useRef(false);

  /**
   * Para a busca em andamento
   */
  const stopSearch = () => {
    stopSearchRef.current = true;
  };

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
    seenPlaceIds: Set<string>
  ): Promise<{ leads: Lead[]; found: number }> => {
    let pageToken: string | null = null;
    let count = 0;
    const leads: Lead[] = [];
    let found = 0;

    const areaLabel = neighborhood ? `${cat.label} - ${neighborhood}` : cat.label;

    do {
      if (stopSearchRef.current) break;

      const { results, nextPageToken } = await searchPlaces(
        selectedCity,
        selectedState,
        cat.query,
        pageToken,
        apiKey,
        neighborhood
      );

      found += results.length;

      for (const lead of results) {
        if (stopSearchRef.current) break;
        if (count >= maxLeads) break;

        // Deduplicar por place_id (entre bairros diferentes)
        if (seenPlaceIds.has(lead.place_id)) continue;
        seenPlaceIds.add(lead.place_id);

        let enrichedLead: Lead = {
          ...lead,
          category: cat.label,
          categoryId: cat.id,
          city: selectedCity,
          state: selectedState,
        };

        // A API New já retorna phone/website no Text Search.
        // Só buscar detalhes se ambos estiverem faltando.
        if (!lead.phone && !lead.website) {
          try {
            const details = await getPlaceDetails(lead.place_id, apiKey);
            enrichedLead = {
              ...enrichedLead,
              phone: details.formatted_phone_number || enrichedLead.phone,
              website: details.website || enrichedLead.website,
            };
          } catch (error) {
            console.warn(`Failed to get details for ${lead.name}:`, error);
          }
        }

        leads.push(enrichedLead);
        count++;

        setSearchStatus(`${areaLabel}: ${count}/${maxLeads} leads`);
      }

      if (count >= maxLeads) break;

      pageToken = nextPageToken;

      if (pageToken && !stopSearchRef.current) {
        await sleep(PAGINATION_DELAY_MS);
      }
    } while (pageToken && !stopSearchRef.current && count < maxLeads);

    return { leads, found };
  };

  /**
   * Realiza a busca de leads nas categorias especificadas
   * @param selectedState - Estado selecionado (UF)
   * @param selectedCity - Cidade selecionada
   * @param selectedNeighborhoods - Bairros selecionados (vazio = cidade toda)
   * @param categories - Lista de categorias para buscar
   * @param apiKey - Chave da API do Google Places
   * @param maxLeadsPerCategory - Número máximo de leads por categoria
   * @param targetCategoryId - ID de categoria específica (opcional, senão busca todas)
   * @returns Objeto com resultado da busca
   */
  const handleSearch = async (
    selectedState: string,
    selectedCity: string,
    selectedNeighborhoods: string[],
    categories: Category[],
    apiKey: string,
    maxLeadsPerCategory: number,
    targetCategoryId: string | null = null
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

    setIsSearching(true);
    stopSearchRef.current = false;

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
        if (stopSearchRef.current) break;

        const categoryLeads: Lead[] = [];
        const seenPlaceIds = new Set<string>();

        setSearchStatus(`Buscando ${cat.label}...`);

        // Iterar por cada área (bairro ou cidade toda)
        for (const area of areas) {
          if (stopSearchRef.current) break;
          if (categoryLeads.length >= maxLeadsPerCategory) break;

          const remaining = maxLeadsPerCategory - categoryLeads.length;

          const { leads, found } = await searchCategoryInArea(
            selectedCity,
            selectedState,
            cat,
            area,
            apiKey,
            remaining,
            seenPlaceIds
          );

          categoryLeads.push(...leads);
          totalFound += found;

          // Delay entre bairros
          if (area !== areas[areas.length - 1] && !stopSearchRef.current) {
            await sleep(500);
          }
        }

        totalAdded += categoryLeads.length;
        allNewLeads.push(...categoryLeads);

        // Delay entre categorias
        if (!stopSearchRef.current && catsToSearch.indexOf(cat) < catsToSearch.length - 1) {
          await sleep(500);
        }
      }

      // Montar mensagem de resultado
      let message = '';
      if (stopSearchRef.current) {
        message = `Busca interrompida. ${totalAdded} novos leads adicionados de ${totalFound} encontrados.`;
      } else {
        message = `Varredura concluída! ${totalAdded} novos leads adicionados de ${totalFound} encontrados.`;
      }

      return {
        success: true,
        newLeads: allNewLeads,
        message,
        wasStopped: stopSearchRef.current
      };
    } catch (error) {
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
      stopSearchRef.current = false;
    }
  };

  return {
    isSearching,
    searchStatus,
    handleSearch,
    stopSearch
  };
};
