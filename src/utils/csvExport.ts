import type { Lead } from '../types';

/**
 * Gera o conteúdo CSV a partir de uma lista de leads
 * @param leads Lista de leads
 * @returns String formatada como CSV
 */
export const generateCSVContent = (leads: Lead[]): string => {
  // Definição das colunas e como acessar seus dados
  const columns = [
    { header: 'Nome', accessor: (l: Lead) => l.name },
    { header: 'Endereço', accessor: (l: Lead) => l.address || '' },
    { header: 'Cidade', accessor: (l: Lead) => l.city || '' },
    { header: 'Estado', accessor: (l: Lead) => l.state || '' },
    { header: 'Telefone', accessor: (l: Lead) => l.phone || '' },
    { header: 'Website', accessor: (l: Lead) => l.website || '' },
    { header: 'Categoria', accessor: (l: Lead) => l.category || '' },
    { header: 'Avaliação', accessor: (l: Lead) => l.rating?.toString() || '' },
    { header: 'Total Avaliações', accessor: (l: Lead) => l.user_ratings_total?.toString() || '' },
    { header: 'Status', accessor: (l: Lead) => l.status || 'NEW' },
    { 
      header: 'Anotações', 
      accessor: (l: Lead) => l.notes ? l.notes.map((n: any) => n.text).join(' | ') : '' 
    }
  ];

  // Gerar linha de cabeçalho
  const headerRow = columns.map(col => `"${col.header}"`).join(',');

  // Gerar linhas de dados
  const dataRows = leads.map(lead => {
    return columns.map(col => {
      const value = col.accessor(lead);
      // Converter para string e escapar aspas duplas existentes (substituindo " por "")
      const stringValue = String(value).replace(/"/g, '""');
      // Envolver o campo em aspas para lidar com vírgulas e quebras de linha dentro do conteúdo
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combinar cabeçalho e dados com quebras de linha
  // Adiciona BOM (Byte Order Mark) para garantir que o Excel abra com UTF-8 corretamente
  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
};

/**
 * Converte um array de Leads para formato CSV e dispara o download
 * @param leads Lista de leads para exportar
 * @param filename Nome do arquivo (padrão: leads_export.csv)
 */
export const exportLeadsToCSV = (leads: Lead[], filename: string = 'leads_export.csv'): void => {
  if (!leads.length) {
    return;
  }

  const csvContent = generateCSVContent(leads);

  // Criar Blob e Link para download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Criar URL temporária
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};