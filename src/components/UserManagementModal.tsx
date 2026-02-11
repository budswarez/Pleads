import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, X, Trash2, Plus, Loader2, ShieldCheck, User } from 'lucide-react';
import type { UserProfile } from '../types';
import { listUsers, createUser, deleteUser } from '../services/authService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const UserManagementModal = ({ isOpen, onClose, currentUserId }: UserManagementModalProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEscapeKey(onClose, isOpen);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    const data = await listUsers();
    setUsers(data);
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Preencha email e senha.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsCreating(true);
    const result = await createUser(email.trim(), password, name.trim());
    setIsCreating(false);

    if (result.success) {
      toast.success('Usuário criado com sucesso!');
      setName('');
      setEmail('');
      setPassword('');
      await loadUsers();
    } else {
      toast.error(result.error || 'Erro ao criar usuário.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o usuário "${userName}"?`)) {
      return;
    }

    setDeletingId(userId);
    const result = await deleteUser(userId);
    setDeletingId(null);

    if (result.success) {
      toast.success('Usuário removido com sucesso!');
      await loadUsers();
    } else {
      toast.error(result.error || 'Erro ao remover usuário.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Users size={24} />
            <h2 className="text-xl font-semibold text-foreground">Gestão de Usuários</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Add User Form */}
          <form onSubmit={handleCreateUser} className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Adicionar Novo Usuário</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isCreating}
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isCreating}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Senha (min. 6)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isCreating}
                  required
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Adicionar
                </button>
              </div>
            </div>
          </form>

          {/* Users List */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Usuários Cadastrados ({users.length})
            </h3>

            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum usuário cadastrado.
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between bg-secondary/50 rounded-md border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {u.role === 'admin' ? (
                        <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <User size={16} className="text-blue-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {u.name || u.email}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            u.role === 'admin'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </div>

                    {/* Only show delete for non-current users */}
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                        disabled={deletingId === u.id}
                        className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors disabled:opacity-50"
                        title={`Remover ${u.name || u.email}`}
                        aria-label={`Remover ${u.name || u.email}`}
                      >
                        {deletingId === u.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full bg-secondary text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
