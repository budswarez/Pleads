import type { Category, Status, Lead } from '../types';

interface FilterTabsProps {
    hasLocationSelected: boolean;
    baseFilteredLeads: Lead[];
    categories: Category[];
    categoryCounts: Map<string, number>;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    statuses: Status[];
    statusCounts: Map<string, number>;
    activeStatus: string | null;
    setActiveStatus: (status: string | null) => void;
}

export function FilterTabs({
    hasLocationSelected,
    baseFilteredLeads,
    categories,
    categoryCounts,
    activeTab,
    setActiveTab,
    statuses,
    statusCounts,
    activeStatus,
    setActiveStatus
}: FilterTabsProps) {
    if (!hasLocationSelected || baseFilteredLeads.length === 0) return null;

    return (
        <>
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'all'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    aria-label="Todas as categorias"
                >
                    Todas
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5 transition-colors duration-300 ${activeTab === 'all'
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-secondary text-secondary-foreground'
                        }`}>
                        {baseFilteredLeads.length}
                    </span>
                </button>
                {categories.map(cat => {
                    const count = categoryCounts.get(cat.id) || 0;
                    const isActive = activeTab === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                }`}
                            aria-label={`Filtrar por ${cat.label}`}
                        >
                            {cat.label}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5 transition-colors duration-300 ${isActive
                                ? 'bg-primary-foreground text-primary'
                                : 'bg-secondary text-secondary-foreground'
                                }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveStatus('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === 'all'
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                        }`}
                    aria-label="Todos os status"
                >
                    Todos Status
                </button>
                {statuses.map(status => {
                    const count = statusCounts.get(status.id) || 0;
                    if (count === 0 && activeStatus !== status.id) return null;

                    return (
                        <button
                            key={status.id}
                            onClick={() => setActiveStatus(status.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === status.id
                                ? 'bg-foreground text-background border-foreground shadow-sm'
                                : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                                }`}
                            aria-label={`Filtrar por status ${status.label}`}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: status.color }}
                                aria-hidden="true"
                            />
                            {status.label} ({count})
                        </button>
                    );
                })}
            </div>
        </>
    );
}
