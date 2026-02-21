import React from 'react';
import { Download } from 'lucide-react';
import type { Lead } from '../types';
import { exportLeadsToCSV } from '../utils/csvExport';

interface ExportButtonProps {
  leads: Lead[];
  disabled?: boolean;
  filename?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  leads, 
  disabled = false,
  filename 
}) => {
  const handleExport = () => {
    exportLeadsToCSV(leads, filename);
  };

  const leadCount = leads.length;

  return (
    <button
      onClick={handleExport}
      disabled={disabled || leadCount === 0}
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      title={leadCount > 0 ? `Exportar ${leadCount} leads para CSV` : 'Nenhum lead para exportar'}
      aria-label="Exportar leads para CSV"
    >
      <Download size={16} />
      <span className="hidden sm:inline">Exportar CSV</span>
    </button>
  );
};