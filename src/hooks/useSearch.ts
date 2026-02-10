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
   * Realiza a busca de leads nas categorias especificadas
   * @param selectedState - Estado selecionado (UF)
   * @param selectedCity - Cidade selecionada
   * @param selectedNeighborhood - Bairro selecionado (opcional)
   * @param categories - Lista de categorias para buscar
   * @param apiKey - Chave da API do Google Places
   * @param maxLeadsPerCategory - Número máximo de leads por categoria
   * @param targetCategoryId - ID de categoria específica (opcional, senão busca todas)
   * @returns Objeto com resultado da busca
   */
  const handleSearch = async (
    selectedState: string,
    selectedCity: string,
    selectedNeighborhood: string,
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

      // Buscar em cada categoria
      for (const cat of catsToSearch) {
        if (stopSearchRef.current) break;

        let pageToken: string | null = null;
        let categoryLeadsCount = 0;
        const categoryLeads: Lead[] = [];

        setSearchStatus(`Buscando ${cat.label}...`);

        // Loop de paginação
        do {
          if (stopSearchRef.current) break;

          // Buscar página de resultados
          const { results, nextPageToken } = await searchPlaces(
            selectedCity,
            selectedState,
            cat.query,
            pageToken,
            apiKey,
            selectedNeighborhood || null
          );

          totalFound += results.length;

          // Enriquecer resultados com detalhes (telefone, website)
          for (const lead of results) {
            if (stopSearchRef.current) break;
            if (categoryLeadsCount >= maxLeadsPerCategory) break;

            try {
              // Buscar detalhes adicionais
              const details = await getPlaceDetails(lead.place_id, apiKey);

              // Mesclar detalhes com lead básico
              const enrichedLead: Lead = {
                ...lead,
                phone: details.formatted_phone_number || lead.phone,
                website: details.website || lead.website,
                category: cat.label,
                categoryId: cat.id,
                city: selectedCity,
                state: selectedState
              };

              categoryLeads.push(enrichedLead);
              categoryLeadsCount++;
              totalAdded++;
            } catch (error) {
              console.warn(`Failed to get details for ${lead.name}:`, error);
              // Ainda adiciona o lead sem os detalhes completos
              const basicLead: Lead = {
                ...lead,
                category: cat.label,
                categoryId: cat.id,
                city: selectedCity,
                state: selectedState
              };

              categoryLeads.push(basicLead);
              categoryLeadsCount++;
              totalAdded++;
            }

            setSearchStatus(
              `${cat.label}: ${categoryLeadsCount}/${maxLeadsPerCategory} leads`
            );
          }

          // Verificar se atingiu limite da categoria
          if (categoryLeadsCount >= maxLeadsPerCategory) {
            break;
          }

          // Preparar próxima página
          pageToken = nextPageToken;

          // Delay obrigatório entre páginas (política do Google)
          if (pageToken && !stopSearchRef.current) {
            await sleep(PAGINATION_DELAY_MS);
          }
        } while (pageToken && !stopSearchRef.current && categoryLeadsCount < maxLeadsPerCategory);

        // Adicionar leads desta categoria ao resultado final
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
        newLeads: allNewLeads, // Retorna os que foram adicionados até o erro
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
