import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-lg border border-border bg-card ${className}`}>
      {Icon && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-full">
          <Icon size={24} className="text-muted-foreground" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>}
      <div className="text-sm text-muted-foreground">
        {description}
      </div>
    </div>
  );
}