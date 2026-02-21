import { Lead } from '../types';

/**
 * Utility to export lead data to a CSV file
 */
export const exportLeadsToCSV = (leads: Lead[], filename: string = 'leads-export.csv') => {
    if (leads.length === 0) return;

    // Define CSV headers
    const headers = [
        'Nome',
        'Endereço',
        'Cidade',
        'Estado',
        'Categoria',
        'Telefone',
        'Website',
        'Avaliação',
        'Total de Avaliações',
        'Notas'
    ];

    // Map leads to CSV rows
    const rows = leads.map(lead => [
        lead.name,
        lead.address,
        lead.city || '',
        lead.state || '',
        lead.category || '',
        lead.phone || '',
        lead.website || '',
        lead.rating || '',
        lead.user_ratings_total || '',
        (lead.notes || []).map(n => `[${n.date}] ${n.text}`).join(' | ') // Format notes with date and use .text property
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(value => {
            // Escape double quotes and wrap in double quotes if it contains comma, newline or double quote
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(','))
    ].join('\n');

    // Create biological blob and download link
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
