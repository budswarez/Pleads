import React, { useState } from 'react';
import { X, Send, Clock, Trash2 } from 'lucide-react';
import type { Lead } from '../types';

interface LeadNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    onAddNote: (placeId: string, text: string) => void;
    onDeleteNote: (placeId: string, noteId: number) => void;
}

export default function LeadNotesModal({ isOpen, onClose, lead, onAddNote, onDeleteNote }: LeadNotesModalProps) {
    const [newNote, setNewNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNote.trim()) {
            onAddNote(lead.place_id, newNote.trim());
            setNewNote('');
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(dateString));
        } catch {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border bg-secondary/30">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Anotações</h2>
                        <p className="text-sm text-muted-foreground">{lead.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                    {(!lead.notes || lead.notes.length === 0) ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhuma anotação ainda.</p>
                            <p className="text-sm">Seja o primeiro a adicionar uma nota para este lead.</p>
                        </div>
                    ) : (
                        lead.notes.map((note) => (
                            <div key={note.id} className="bg-card border border-border rounded-lg p-3 shadow-sm group relative">
                                <button
                                    onClick={() => onDeleteNote(lead.place_id, note.id)}
                                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    title="Excluir anotação"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-6">{note.text}</p>
                                <div className="mt-2 flex items-center text-[10px] text-muted-foreground">
                                    <Clock size={12} className="mr-1" />
                                    {formatDate(note.date)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Note Input */}
                <div className="p-4 border-t border-border bg-secondary/30">
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Adicionar nova anotação..."
                            className="w-full text-sm bg-background border border-border rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20 shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newNote.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-sm"
                            aria-label="Enviar anotação"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                    <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Pressione Enter para enviar, Shift + Enter para nova linha
                    </p>
                </div>
            </div>
        </div>
    );
}
