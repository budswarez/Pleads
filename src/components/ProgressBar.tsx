interface ProgressBarProps {
  current: number;
  total: number;
  isSearching: boolean;
}

export function ProgressBar({ current, total, isSearching }: ProgressBarProps) {
  if (!isSearching || total === 0) return null;

  // Calcula a porcentagem, limitando a 100%
  const percentage = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="w-full mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
        <span>Progresso da busca</span>
        <span>{current} / {total} leads (meta)</span>
      </div>
      <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/50">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
            {/* Efeito de brilho animado */}
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-[-45deg]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}></div>
        </div>
      </div>
    </div>
  );
}