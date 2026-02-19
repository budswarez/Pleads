import React, { useState } from 'react';
import { MapPin, Phone, Globe, MessageCircle, ExternalLink, Star, StarHalf, FileText } from 'lucide-react';
import LeadNotesModal from './LeadNotesModal';
import type { Lead, Status, Category } from '../types';

interface LeadCardProps {
  lead: Lead;
  statuses: Status[];
  categories: Category[];
  onStatusUpdate: (placeId: string, status: string) => void;
  onNotesUpdate: (placeId: string, notes: string) => void;
}

/**
 * Abre WhatsApp com o número fornecido
 */
const openWhatsApp = (phone: string | undefined) => {
  if (!phone) return;
  const cleanPhone = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}`, '_blank');
};

/**
 * Renderiza as estrelas de avaliação
 */
const renderStars = (rating?: number) => {
  if (!rating) return null;

  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<StarHalf key={i} size={14} className="fill-yellow-400 text-yellow-400" />);
    } else {
      stars.push(<Star key={i} size={14} className="text-muted-foreground" />);
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
};

/**
 * Componente memoizado para renderizar um card de lead
 * Otimizado para performance em listas grandes
 */
const LeadCard = React.memo(({
  lead,
  statuses,
  categories,
  onStatusUpdate,
  onNotesUpdate
}: LeadCardProps) => {
  // Obter cor do status
  const getStatusColor = (statusId?: string): string => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.color : '#6b7280'; // Default gray-500
  };

  // Obter label da categoria
  const getCategoryLabel = (): string => {
    if (lead.categoryId) {
      return categories.find(c => c.id === lead.categoryId)?.label || lead.category || '';
    }
    return lead.category || '';
  };

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const notesCount = lead.notes ? lead.notes.length : 0;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-4 md:p-6 flex flex-col hover:shadow-md transition-shadow">
      {/* Header com nome e status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: getStatusColor(lead.status) }}
              aria-label={`Status: ${lead.status}`}
              title={lead.status}
            />
            <h3 className="font-semibold text-base md:text-lg line-clamp-1">{lead.name}</h3>
          </div>
          <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-block">
            {getCategoryLabel()}
          </span>
        </div>
        <div className="flex gap-1">
          {lead.phone && (
            <button
              onClick={() => openWhatsApp(lead.phone)}
              className="p-1.5 text-muted-foreground hover:text-green-500 transition-colors"
              title="Abrir WhatsApp"
              aria-label={`Abrir WhatsApp para ${lead.name}`}
            >
              <MessageCircle size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Informações de contato */}
      <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-grow">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2 text-xs">{lead.address}</span>
        </div>
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs">
            <Phone size={14} />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-2 text-xs">
            <Globe size={14} />
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-primary truncate max-w-[200px] block"
              aria-label={`Visitar website de ${lead.name}`}
            >
              {lead.website}
            </a>
          </div>
        )}
        {renderStars(lead.rating)}
      </div>

      {/* Seção de comentários */}
      <div className="mb-4">
        <button
          onClick={() => setIsNotesModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border shadow-sm"
          aria-label="Ver ou adicionar anotações"
        >
          <FileText size={14} />
          {notesCount > 0 ? `${notesCount} anotaç${notesCount === 1 ? 'ão' : 'ões'}` : 'Adicionar anotação'}
        </button>
      </div>

      {/* Footer com status e link para Maps */}
      <div className="mt-auto pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <select
            className="text-[10px] bg-secondary border border-border rounded px-2 py-1 focus:outline-none"
            value={lead.status || 'NEW'}
            onChange={(e) => onStatusUpdate(lead.place_id, e.target.value)}
            aria-label={`Status de ${lead.name}`}
          >
            {statuses.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.place_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
            aria-label={`Ver ${lead.name} no Google Maps`}
          >
            Maps <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Modal de Anotações */}
      <LeadNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        lead={lead}
        onAddNote={onNotesUpdate}
      />
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
