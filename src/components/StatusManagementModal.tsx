import { useState } from 'react';
import { Palette, X, Plus, Trash2 } from 'lucide-react';
import type { StatusManagementModalProps } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

/**
 * Modal for managing lead statuses
 * Allows users to add, view, and remove custom statuses with color coding
 */
const StatusManagementModal = ({
  isOpen,
  onClose,
  statuses,
  addStatus,
  removeStatus
}: StatusManagementModalProps) => {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  // Close modal on Escape key
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      addStatus(newLabel.trim(), newColor);
      setNewLabel('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <Palette className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Gestão de Status</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="status-label"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block"
                >
                  Novo Status
                </label>
                <div className="flex gap-2">
                  <input
                    id="status-label"
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Interessado, Prioridade..."
                    className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="relative w-10 h-10 shrink-0">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      aria-label="Selecionar cor do status"
                    />
                    <div
                      className="w-full h-full rounded-md border border-border"
                      style={{ backgroundColor: newColor }}
                      aria-hidden="true"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-opacity-90 transition-colors"
                    aria-label="Adicionar status"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Status Atuais
            </label>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: status.color }}
                      aria-label={`Cor: ${status.color}`}
                    />
                    <span className="text-sm font-medium text-foreground">{status.label}</span>
                  </div>
                  <button
                    onClick={() => removeStatus(status.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    aria-label={`Remover status ${status.label}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/10 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusManagementModal;
