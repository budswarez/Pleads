import { useState } from 'react';
import { Settings, X, Plus, Trash2 } from 'lucide-react';
import type { CategoryManagementModalProps } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

/**
 * Modal for managing business categories
 * Allows users to add, view, and remove custom search categories
 */
const CategoryManagementModal = ({
  isOpen,
  onClose,
  categories,
  addCategory,
  removeCategory
}: CategoryManagementModalProps) => {
  const [newLabel, setNewLabel] = useState('');
  const [newQuery, setNewQuery] = useState('');

  // Close modal on Escape key
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim() && newQuery.trim()) {
      addCategory(newLabel.trim(), newQuery.trim());
      setNewLabel('');
      setNewQuery('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Gestão de Categorias</h2>
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
                  htmlFor="category-label"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block"
                >
                  Nova Categoria
                </label>
                <div className="space-y-2">
                  <input
                    id="category-label"
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Nome (Ex: Farmácias)"
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2">
                    <input
                      id="category-query"
                      type="text"
                      value={newQuery}
                      onChange={(e) => setNewQuery(e.target.value)}
                      placeholder="Termo de Busca (Ex: farmacia)"
                      className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-opacity-90 transition-colors"
                      aria-label="Adicionar categoria"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Categorias Atuais
            </label>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    <span className="text-[10px] text-muted-foreground">Query: {cat.query}</span>
                  </div>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    aria-label={`Remover categoria ${cat.label}`}
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

export default CategoryManagementModal;
