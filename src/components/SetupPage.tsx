import { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { setupAdmin } from '../services/authService';
import useStore from '../store/useStore';

interface SetupPageProps {
  onSetupComplete: () => void;
}

const SetupPage = ({ onSetupComplete }: SetupPageProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { appTitle, appLogoUrl } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const result = await setupAdmin(email.trim(), password, name.trim());
    setIsLoading(false);

    if (result.success) {
      onSetupComplete();
    } else {
      setError(result.error || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {appLogoUrl && (
            <img
              src={appLogoUrl}
              alt="Logo"
              className="w-16 h-16 object-contain rounded-lg shadow-inner bg-black mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-primary">{appTitle}</h1>
          <p className="text-muted-foreground text-sm mt-1">Configuração Inicial</p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <ShieldCheck size={20} />
            <h2 className="text-lg font-semibold text-foreground">Criar Conta Administrador</h2>
          </div>

          <p className="text-muted-foreground text-xs">
            Esta é a primeira configuração do sistema. Crie uma conta de administrador para gerenciar o acesso.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="setup-name" className="block text-sm font-medium text-muted-foreground mb-1">
              Nome
            </label>
            <input
              id="setup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Seu nome"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="setup-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="setup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="setup-password" className="block text-sm font-medium text-muted-foreground mb-1">
              Senha
            </label>
            <input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="setup-confirm" className="block text-sm font-medium text-muted-foreground mb-1">
              Confirmar Senha
            </label>
            <input
              id="setup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Repita a senha"
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            {isLoading ? 'Criando conta...' : 'Criar Conta Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPage;
