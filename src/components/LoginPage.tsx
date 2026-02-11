import { useState } from 'react';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const LoginPage = ({ onSignIn }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { appTitle, appLogoUrl } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Preencha email e senha.');
      return;
    }

    setIsLoading(true);
    const result = await onSignIn(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Erro ao fazer login.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
          <p className="text-muted-foreground text-sm mt-1">Faça login para continuar</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-muted-foreground mb-1">
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Sua senha"
              autoComplete="current-password"
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
              <LogIn size={16} />
            )}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
