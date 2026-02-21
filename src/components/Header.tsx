import { useState } from 'react';
import { Loader2, Palette, MapPin, Users, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
    appTitle: string;
    appDescription: string;
    appLogoUrl: string;
    isAdmin: boolean;
    username: string;
    handleSignOut: () => void;
    openCategoryModal: () => void;
    openStatusModal: () => void;
    openLocationModal: () => void;
    openSettingsModal: () => void;
    openUserModal: () => void;
}

export function Header({
    appTitle,
    appDescription,
    appLogoUrl,
    isAdmin,
    username,
    handleSignOut,
    openCategoryModal,
    openStatusModal,
    openLocationModal,
    openSettingsModal,
    openUserModal
}: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="mb-4 md:mb-8 max-w-7xl mx-auto border-b md:border-none pb-4 md:pb-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {appLogoUrl && (
                        <img
                            src={appLogoUrl}
                            alt="Logo"
                            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg shadow-inner bg-black"
                        />
                    )}
                    <div>
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-primary">{appTitle}</h1>
                        <p className="text-xs md:text-base text-muted-foreground mt-1 hidden sm:block">{appDescription}</p>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={openCategoryModal}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
                        aria-label="Abrir gestão de categorias"
                    >
                        <Loader2 size={16} />
                        Categorias
                    </button>
                    <button
                        onClick={openStatusModal}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
                        aria-label="Abrir gestão de status"
                    >
                        <Palette size={16} />
                        Status
                    </button>
                    <button
                        onClick={openLocationModal}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
                        aria-label="Abrir gestão de locais"
                    >
                        <MapPin size={16} />
                        Locais
                    </button>
                    {isAdmin && (
                        <button
                            onClick={openUserModal}
                            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
                            aria-label="Abrir gestão de usuários"
                        >
                            <Users size={16} />
                            Usuários
                        </button>
                    )}
                    <button
                        onClick={openSettingsModal}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
                        aria-label="Abrir configurações"
                    >
                        <Settings size={16} />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors"
                        aria-label="Alternar tema"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* User info & Logout */}
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                        <span className="text-xs text-muted-foreground hidden lg:block">
                            {username}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors"
                            title="Sair"
                            aria-label="Sair do sistema"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center gap-2">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-foreground hover:bg-secondary rounded-md"
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden mt-4 space-y-2 border-t pt-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-end px-2 mb-2">
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors"
                        >
                            {theme === 'dark' ? <><Sun size={16} /> Modo Claro</> : <><Moon size={16} /> Modo Escuro</>}
                        </button>
                    </div>
                    <div className="flex items-center justify-between px-2 mb-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            {username}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors flex items-center gap-2"
                            aria-label="Sair do sistema"
                        >
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => { openCategoryModal(); setIsMobileMenuOpen(false); }}
                            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
                        >
                            <Loader2 size={16} />
                            Categorias
                        </button>
                        <button
                            onClick={() => { openStatusModal(); setIsMobileMenuOpen(false); }}
                            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
                        >
                            <Palette size={16} />
                            Status
                        </button>
                        <button
                            onClick={() => { openLocationModal(); setIsMobileMenuOpen(false); }}
                            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
                        >
                            <MapPin size={16} />
                            Locais
                        </button>
                        <button
                            onClick={() => { openSettingsModal(); setIsMobileMenuOpen(false); }}
                            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
                        >
                            <Settings size={16} />
                            Configurações
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => { openUserModal(); setIsMobileMenuOpen(false); }}
                                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 col-span-2"
                            >
                                <Users size={16} />
                                Usuários
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
