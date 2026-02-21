import React, { useState } from 'react';
import { MapPin, Phone, Globe, MessageCircle, ExternalLink, Star, StarHalf, FileText, Trash2 } from 'lucide-react';
import LeadNotesModal from './LeadNotesModal';
import type { Lead, Status, Category } from '../types';

interface LeadCardProps {
  lead: Lead;
  statuses: Status[];
  categories: Category[];
  onStatusUpdate: (placeId: string, status: string) => void;
  onNotesUpdate: (placeId: string, notes: string) => void;
  onNoteDelete: (placeId: string, noteId: number) => void;
  onRemoveLead: (placeId: string) => void;
  viewMode?: 'grid' | 'list';
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
 * Verifica se um número de telefone é de celular (BR)
 * Critério: após o DDD (2 dígitos) ou DDI+DDD (4 dígitos), o primeiro número deve ser 6, 7, 8 ou 9
 */
const isMobileNumber = (phone: string | undefined): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');

  // Se for 55 (DDI), removemos
  const digits = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;

  // Após o DDD (2 dígitos), pegamos o próximo dígito
  if (digits.length < 3) return false;
  const firstDigitAfterDDD = digits.charAt(2);

  return ['6', '7', '8', '9'].includes(firstDigitAfterDDD);
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
  onNotesUpdate,
  onNoteDelete,
  onRemoveLead,
  viewMode = 'grid'
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
  const isMobile = isMobileNumber(lead.phone);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onRemoveLead(lead.place_id);
    }, 300);
  };

  return (
    <div className={`bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ${isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${viewMode === 'grid' ? 'p-4 md:p-6 flex flex-col' : 'p-3 flex items-center gap-4'}`}>
      {/* Header com nome e status */}
      <div className={`${viewMode === 'grid' ? 'flex justify-between items-start mb-4' : 'flex-1 grid grid-cols-1 md:grid-cols-4 items-center gap-4'}`}>
        <div className={`${viewMode === 'grid' ? 'flex-1' : 'md:col-span-2'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
              style={{ backgroundColor: getStatusColor(lead.status) }}
              aria-label={`Status: ${lead.status}`}
              title={lead.status}
            />
            <h3 className={`font-semibold line-clamp-1 truncate ${viewMode === 'grid' ? 'text-base md:text-lg' : 'text-sm'}`}>{lead.name}</h3>
          </div>
          <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-block">
            {getCategoryLabel()}
          </span>
        </div>

        {viewMode === 'list' && (
          <>
            <div className="text-xs text-muted-foreground flex items-center gap-2 md:col-span-1 min-w-0">
              <MapPin size={12} className="flex-shrink-0" />
              <span className="truncate">{lead.address}</span>
            </div>
            <div className="flex items-center justify-end gap-3 md:col-span-1">
              {lead.phone && <span className="text-xs font-mono hidden md:inline">{lead.phone}</span>}
              {isMobile ? (
                <button
                  onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone); }}
                  className="p-1.5 text-white bg-green-600 hover:bg-green-700 rounded-full transition-colors shadow-sm"
                  title="Entrar em contato via WhatsApp"
                >
                  <MessageCircle size={14} />
                </button>
              ) : (
                <div className="p-1.5 text-muted-foreground bg-secondary/50 rounded-full border border-border opacity-50 cursor-not-allowed">
                  <MessageCircle size={14} />
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'grid' && (
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-2 -mt-2"
            aria-label={`Excluir lead ${lead.name}`}
            title="Excluir lead"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Informações de contato (Somente Grid) */}
      {viewMode === 'grid' && (
        <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-grow text-xs">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{lead.address}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>{lead.phone}</span>
            </div>
          )}

          {/* Botão de WhatsApp */}
          <div className="mt-1">
            {isMobile ? (
              <button
                onClick={() => openWhatsApp(lead.phone)}
                className="flex items-center gap-1.5 py-1 px-3 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-full transition-colors shadow-sm"
                title="Entrar em contato via WhatsApp"
              >
                <MessageCircle size={14} />
                Entrar em contato
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 py-1 px-3 text-[11px] font-semibold text-muted-foreground bg-secondary/50 border border-border rounded-full w-fit cursor-not-allowed opacity-70"
                title="Número fixo ou indisponível para WhatsApp"
              >
                <MessageCircle size={14} className="opacity-40" />
                Sem whatsapp
              </div>
            )}
          </div>

          {lead.website && (
            <div className="flex items-center gap-2 mt-2">
              <Globe size={14} />
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary truncate max-w-[200px] block"
              >
                {lead.website}
              </a>
            </div>
          )}
          <div className="mt-1">
            {renderStars(lead.rating)}
          </div>
        </div>
      )}

      {/* Ações / Footer */}
      <div className={`${viewMode === 'grid' ? 'mb-4' : 'flex items-center gap-3 ml-auto'}`}>
        <button
          onClick={() => setIsNotesModalOpen(true)}
          className={`flex items-center justify-center gap-2 font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border shadow-sm ${viewMode === 'grid' ? 'w-full py-2 px-4 text-xs' : 'py-1.5 px-3 text-[10px]'}`}
        >
          <FileText size={viewMode === 'grid' ? 14 : 12} />
          {notesCount > 0 ? `${notesCount} anotaç${notesCount === 1 ? 'ão' : 'ões'}` : 'Anotação'}
        </button>

        {viewMode === 'list' && (
          <div className="flex items-center gap-2">
            <select
              className="text-[10px] bg-secondary border border-border rounded px-2 py-1 focus:outline-none"
              value={lead.status || 'NEW'}
              onChange={(e) => onStatusUpdate(lead.place_id, e.target.value)}
            >
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              Maps <ExternalLink size={10} />
            </a>
            <button
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Status selection and Maps link (Grid only) */}
      {viewMode === 'grid' && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <select
              className="text-[10px] bg-secondary border border-border rounded px-2 py-1 focus:outline-none"
              value={lead.status || 'NEW'}
              onChange={(e) => onStatusUpdate(lead.place_id, e.target.value)}
            >
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              Maps <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Modal de Anotações */}
      <LeadNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        lead={lead}
        onAddNote={onNotesUpdate}
        onDeleteNote={onNoteDelete}
      />
    </div>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
