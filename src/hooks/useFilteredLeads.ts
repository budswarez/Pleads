import { useMemo } from 'react';
import type { Lead, Category, Status } from '../types';

/**
 * Verifica se um lead pertence a uma categoria específica
 * @param lead - Lead a verificar
 * @param categoryId - ID da categoria
 * @returns true se o lead pertence à categoria
 */
const leadMatchesCategory = (lead: Lead, categoryId: string): boolean => {
  // Verifica match direto por categoryId
  if (lead.categoryId === categoryId) return true;

  // Fallback: verifica por nome da categoria
  const leadCat = lead.category?.toLowerCase() || '';

  // Caso especial para restaurantes (pode incluir "food")
  if (categoryId === 'restaurant') {
    return leadCat.includes('restaurant') || leadCat.includes('food');
  }

  // Match genérico por substring
  return leadCat.includes(categoryId);
};

/**
 * Hook para gerenciar filtragem de leads por categoria e status
 * Consolida toda a lógica de filtragem e contagem em um único lugar
 *
 * @param baseLeads - Leads já filtrados por localização (do store)
 * @param categories - Lista de categorias disponíveis
 * @param statuses - Lista de status disponíveis
 * @param activeTab - Categoria ativa (ou 'all' para todas)
 * @param activeStatus - Status ativo (ou 'all' para todos)
 * @returns Objeto com leads filtrados e contadores
 */
export const useFilteredLeads = (
  baseLeads: Lead[],
  categories: Category[],
  statuses: Status[],
  activeTab: string,
  activeStatus: string | null
) => {
  /**
   * Filtra leads pela categoria ativa
   */
  const leadsByCategory = useMemo(() => {
    if (activeTab === 'all') {
      return baseLeads;
    }

    return baseLeads.filter(lead => leadMatchesCategory(lead, activeTab));
  }, [baseLeads, activeTab]);

  /**
   * Filtra leads pela categoria E status ativos
   */
  const finalFilteredLeads = useMemo(() => {
    if (!activeStatus || activeStatus === 'all') {
      return leadsByCategory;
    }

    return leadsByCategory.filter(lead => lead.status === activeStatus);
  }, [leadsByCategory, activeStatus]);

  /**
   * Conta leads por categoria (para tabs)
   * Conta apenas nos leads base (filtrados por localização)
   */
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    categories.forEach(cat => {
      const count = baseLeads.filter(lead =>
        leadMatchesCategory(lead, cat.id)
      ).length;

      counts.set(cat.id, count);
    });

    return counts;
  }, [baseLeads, categories]);

  /**
   * Conta leads por status (para botões de filtro)
   * Conta dentro da categoria ativa
   */
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();

    statuses.forEach(status => {
      const count = leadsByCategory.filter(lead =>
        lead.status === status.id
      ).length;

      counts.set(status.id, count);
    });

    return counts;
  }, [leadsByCategory, statuses]);

  /**
   * Conta total de leads na categoria ativa (todos os status)
   */
  const activeCategoryTotal = useMemo(() => {
    return leadsByCategory.length;
  }, [leadsByCategory]);

  return {
    /**
     * Leads filtrados por categoria e status
     */
    filteredLeads: finalFilteredLeads,

    /**
     * Mapa de categoria -> quantidade de leads
     * Usa base leads (apenas filtro de localização)
     */
    categoryCounts,

    /**
     * Mapa de status -> quantidade de leads
     * Usa leads da categoria ativa
     */
    statusCounts,

    /**
     * Total de leads na categoria ativa (independente do status selecionado)
     */
    activeCategoryTotal,

    /**
     * Função auxiliar para verificar se um lead pertence a uma categoria
     */
    leadMatchesCategory
  };
};
