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
        <header className="w-full px-4 pt-4 mb-6 md:mb-10 bg-background/0">
            <div className="max-w-7xl mx-auto glass-effect rounded-2xl p-4 md:p-6 shadow-xl border border-border/50 transition-all duration-300 hover:shadow-primary/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 md:gap-8">
                        {appLogoUrl && (
                            <div className="relative group cursor-pointer animate-in fade-in zoom-in duration-700">
                                <div className="absolute -inset-2 bg-gradient-to-r from-primary via-blue-400 to-blue-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <img
                                    src={appLogoUrl}
                                    alt="Logo"
                                    className="relative w-16 h-16 md:w-20 md:h-20 object-contain rounded-2xl shadow-2xl bg-black border-2 border-white/20 p-1.5 transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient pb-1 leading-none">
                                {appTitle}
                            </h1>
                            <p className="text-[10px] md:text-sm font-bold text-muted-foreground/90 tracking-[0.2em] uppercase mt-2 hidden sm:block border-l-2 border-primary/30 pl-3">
                                {appDescription}
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-3">
                        <nav className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={openCategoryModal}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 group"
                            >
                                <Loader2 size={16} className="group-hover:rotate-12 transition-transform" />
                                <span>Categorias</span>
                            </button>
                            <button
                                onClick={openStatusModal}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 group"
                            >
                                <Palette size={16} className="group-hover:scale-110 transition-transform" />
                                <span>Status</span>
                            </button>
                            <button
                                onClick={openLocationModal}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 group"
                            >
                                <MapPin size={16} className="group-hover:-translate-y-1 transition-transform" />
                                <span>Locais</span>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={openUserModal}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all flex items-center gap-2 group"
                                >
                                    <Users size={16} className="group-hover:scale-105 transition-transform" />
                                    <span>Usuários</span>
                                </button>
                            )}
                        </nav>

                        <div className="h-8 w-px bg-border/50 mx-2" />

                        <div className="flex items-center gap-2">
                            <button
                                onClick={openSettingsModal}
                                className="bg-primary/10 text-primary p-2.5 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm border border-primary/20"
                                title="Configurações gerais"
                            >
                                <Settings size={20} className="hover:rotate-45 transition-transform duration-500" />
                            </button>

                            <button
                                onClick={toggleTheme}
                                className="p-2.5 bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all border border-border/50"
                                aria-label="Alternar tema"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </div>

                        {/* User info & Logout */}
                        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border/50">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-foreground leading-none">
                                    {username}
                                </span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-1 opacity-70">
                                    {isAdmin ? 'Administrador' : 'Usuário'}
                                </span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all border border-border/50 group"
                                title="Sair do sistema"
                            >
                                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 text-foreground bg-secondary/50 hover:bg-secondary rounded-xl border border-border/50 transition-all"
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
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
