import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAccounts, fetchAccountCategories, type ServiceAccountData, type AccountCategoryData } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Search, Loader2, Eye, EyeOff, Copy, ExternalLink, Key, Globe, User } from 'lucide-react';
import { toast } from 'sonner';

const AccountsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', search, selectedCategory],
    queryFn: () => fetchAccounts({ search: search || undefined, categoryId: selectedCategory || undefined }),
    staleTime: 60000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['accountCategories'],
    queryFn: fetchAccountCategories,
    staleTime: 300000,
  });

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  // Group accounts by category
  const groupByCategory = (accounts: ServiceAccountData[]) => {
    const groups: Record<string, ServiceAccountData[]> = { 'Без категории': [] };
    categories.forEach(cat => { groups[cat.name] = []; });
    
    accounts.forEach(account => {
      const catName = account.category?.name || 'Без категории';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(account);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const groupedAccounts = groupByCategory(accounts);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">Главная / Аккаунты</p>
        <h1 className="text-2xl lg:text-3xl font-bold">Аккаунты</h1>
        <p className="text-muted-foreground text-sm mt-1">Хранилище паролей и учётных данных</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Поиск аккаунта..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-12 px-4 bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">Все категории</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      )}

      {!isLoading && accounts.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Аккаунты не найдены</p>
        </div>
      )}

      {!isLoading && groupedAccounts.map(([categoryName, categoryAccounts]) => (
        <div key={categoryName}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span>{categoryName}</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{categoryAccounts.length}</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAccounts.map((account, index) => (
              <div key={account.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{account.serviceName}</h4>
                      {account.serviceUrl && (
                        <a href={account.serviceUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                          {new URL(account.serviceUrl).hostname}<ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Username */}
                  <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{account.username}</span>
                    </div>
                    <button onClick={() => copyToClipboard(account.username, 'Логин')}
                      className="text-muted-foreground hover:text-foreground p-1">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-mono truncate">
                        {visiblePasswords.has(account.id) ? account.password : '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePassword(account.id)}
                        className="text-muted-foreground hover:text-foreground p-1">
                        {visiblePasswords.has(account.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(account.password, 'Пароль')}
                        className="text-muted-foreground hover:text-foreground p-1">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {account.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{account.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AccountsPage;
