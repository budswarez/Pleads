import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    id: string;
    label: string;
    color?: string;
}

interface ThemedSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    buttonClassName?: string;
    disabled?: boolean;
    label?: string;
}

export function ThemedSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    className = '',
    buttonClassName = '',
    disabled = false,
    label
}: ThemedSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.id === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1 mb-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 bg-secondary/30 hover:bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
            >
                <span className="flex items-center gap-2 truncate">
                    {selectedOption?.color && (
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: selectedOption.color }}
                        />
                    )}
                    <span className={!selectedOption ? 'text-muted-foreground/50' : 'font-medium'}>
                        {selectedOption?.label || placeholder}
                    </span>
                </span>
                <ChevronDown
                    size={16}
                    className={`text-muted-foreground/60 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-[100] mt-1 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden py-1 min-w-[150px]">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${value === option.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/50'}`}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    {option.color && (
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: option.color }}
                                        />
                                    )}
                                    <span className="truncate">{option.label}</span>
                                </div>
                                {value === option.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
