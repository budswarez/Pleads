import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import LeadCard from './LeadCard';
import type { Lead, Status, Category } from '../types';
import useStore from '../store/useStore';

interface VirtualLeadsGridProps {
    leads: Lead[];
    statuses: Status[];
    categories: Category[];
    onStatusUpdate: (placeId: string, status: string) => void;
    onNotesUpdate: (placeId: string, notes: string) => void;
    onNoteDelete: (placeId: string, noteId: number) => void;
    onRemoveLead: (placeId: string) => void;
}

const VirtualLeadsGrid: React.FC<VirtualLeadsGridProps> = ({
    leads,
    statuses,
    categories,
    onStatusUpdate,
    onNotesUpdate,
    onNoteDelete,
    onRemoveLead,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const { leadsViewMode } = useStore();
    const [columns, setColumns] = useState(1);

    // Update columns based on container width
    useEffect(() => {
        const updateColumns = () => {
            if (!parentRef.current) return;
            if (leadsViewMode === 'list') {
                setColumns(1);
                return;
            }
            const width = parentRef.current.offsetWidth;
            if (width >= 1024) setColumns(3); // lg
            else if (width >= 768) setColumns(2); // md
            else setColumns(1); // sm
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, [leadsViewMode]);

    // Group leads into rows
    const rows = useMemo(() => {
        const grouped = [];
        for (let i = 0; i < leads.length; i += columns) {
            grouped.push(leads.slice(i, i + columns));
        }
        return grouped;
    }, [leads, columns]);

    // Virtualizer for rows
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => leadsViewMode === 'grid' ? 380 : 180, // Lower height for list items
        overscan: 5,
    });

    return (
        <div
            ref={parentRef}
            className="h-[800px] overflow-auto rounded-xl border border-border/50 bg-background/20 p-4 custom-scrollbar"
            style={{
                contain: 'strict',
            }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                    >
                        <div
                            className="grid gap-6 px-1"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {rows[virtualRow.index].map((lead) => (
                                <div key={lead.place_id} className={leadsViewMode === 'grid' ? "pb-6" : "pb-3"}>
                                    <LeadCard
                                        lead={lead}
                                        statuses={statuses}
                                        categories={categories}
                                        onStatusUpdate={onStatusUpdate}
                                        onNotesUpdate={onNotesUpdate}
                                        onNoteDelete={onNoteDelete}
                                        onRemoveLead={onRemoveLead}
                                        viewMode={leadsViewMode}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualLeadsGrid;
