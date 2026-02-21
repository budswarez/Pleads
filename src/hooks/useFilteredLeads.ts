import { useMemo } from 'react';
import type { Lead, Category, Status } from '../types';

export type PhoneFilter = 'all' | 'mobile' | 'landline' | 'no_phone';

const isMobileNumber = (phone?: string): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '').replace(/^55/, '');
  if (digits.length < 3) return false;
  return ['6', '7', '8', '9'].includes(digits.charAt(2));
};

/**
 * Verifica se um lead pertence a uma categoria específica
 * @param lead - Lead a verificar
 * @param categoryId - ID da categoria
 * @param categories - Lista de categorias disponíveis (para lookup por label)
 * @returns true se o lead pertence à categoria
 */
const leadMatchesCategory = (lead: Lead, categoryId: string, categories: Category[]): boolean => {
  // Verifica match direto por categoryId
  if (lead.categoryId === categoryId) return true;

  // Fallback: verifica por nome da categoria (lead.category é o label text)
  const leadCat = lead.category?.toLowerCase() || '';
  if (!leadCat) return false;

  // Find the category object to get its label
  const targetCategory = categories.find(c => c.id === categoryId);
  if (targetCategory) {
    const targetLabel = targetCategory.label.toLowerCase();
    // Match if lead's category label matches the target category's label
    if (leadCat === targetLabel) return true;
    // Partial match (e.g. "restaurant" in "restaurantes")
    if (leadCat.includes(targetLabel) || targetLabel.includes(leadCat)) return true;
  }

  // Caso especial para restaurantes (pode incluir "food", "restaurant")
  if (categoryId === 'restaurant' || (targetCategory && targetCategory.label.toLowerCase().includes('restaurante'))) {
    return leadCat.includes('restaurant') || leadCat.includes('food') || leadCat.includes('restaurante');
  }

  return false;
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
 * @param nameFilter - Texto para filtrar leads pelo nome
 * @param phoneFilter - Filtro por tipo de telefone
 * @returns Objeto com leads filtrados e contadores
 */
export const useFilteredLeads = (
  baseLeads: Lead[],
  categories: Category[],
  statuses: Status[],
  activeTab: string,
  activeStatus: string | null,
  nameFilter: string = '',
  phoneFilter: PhoneFilter = 'all'
) => {
  /**
   * Filtra leads pela categoria ativa
   */
  const leadsByCategory = useMemo(() => {
    if (activeTab === 'all') {
      return baseLeads;
    }

    return baseLeads.filter(lead => leadMatchesCategory(lead, activeTab, categories));
  }, [baseLeads, activeTab, categories]);

  /**
   * Filtra leads pelo nome (dentro da categoria ativa)
   */
  const leadsByName = useMemo(() => {
    if (!nameFilter.trim()) return leadsByCategory;

    const lowerFilter = nameFilter.toLowerCase().trim();
    return leadsByCategory.filter(lead => lead.name.toLowerCase().includes(lowerFilter));
  }, [leadsByCategory, nameFilter]);

  /**
   * Filtra leads pelo status ativo
   */
  const leadsByStatus = useMemo(() => {
    return (!activeStatus || activeStatus === 'all')
      ? leadsByName
      : leadsByName.filter(lead => lead.status === activeStatus);
  }, [leadsByName, activeStatus]);

  /**
   * Filtra leads pelo tipo de telefone e ordena alfabeticamente
   */
  const finalFilteredLeads = useMemo(() => {
    let filtered = leadsByStatus;
    if (phoneFilter === 'mobile') {
      filtered = filtered.filter(l => isMobileNumber(l.phone));
    } else if (phoneFilter === 'landline') {
      filtered = filtered.filter(l => !!l.phone && !isMobileNumber(l.phone));
    } else if (phoneFilter === 'no_phone') {
      filtered = filtered.filter(l => !l.phone);
    }
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [leadsByStatus, phoneFilter]);

  /**
   * Conta leads por categoria (para tabs)
   * Conta apenas nos leads base (filtrados por localização)
   */
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    categories.forEach(cat => {
      const count = baseLeads.filter(lead =>
        leadMatchesCategory(lead, cat.id, categories)
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
      const count = leadsByName.filter(lead =>
        lead.status === status.id
      ).length;

      counts.set(status.id, count);
    });

    return counts;
  }, [leadsByName, statuses]);

  /**
   * Conta leads por tipo de telefone (para botões de filtro)
   * Conta dentro do filtro de categoria + nome + status ativos
   */
  const phoneCounts = useMemo(() => ({
    mobile:   leadsByStatus.filter(l => isMobileNumber(l.phone)).length,
    landline: leadsByStatus.filter(l => !!l.phone && !isMobileNumber(l.phone)).length,
    no_phone: leadsByStatus.filter(l => !l.phone).length,
  }), [leadsByStatus]);

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
     * Contagens por tipo de telefone (mobile, landline, no_phone)
     * Refletem o filtro de categoria + nome + status ativos
     */
    phoneCounts,

    /**
     * Função auxiliar para verificar se um lead pertence a uma categoria
     */
    leadMatchesCategory
  };
};
