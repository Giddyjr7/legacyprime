import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { api, APIError } from '@/utils/api';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardLoading } from '@/components/DashboardLoading';

interface Transaction {
  id: string;
  reference: string;
  transaction_type: string;
  transaction_type_display: string;
  amount: string;
  status: string;
  status_display: string;
  created_at: string;
}

export default function Transactions() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredTransactions = useMemo(() => {
    const searchTerm = debouncedSearch.toLowerCase().trim();
    const filtered = transactions.filter(tx => {
      // Check if search term matches any of the transaction fields
      const matchesReference = tx.reference?.toLowerCase().includes(searchTerm);
      const matchesType = tx.transaction_type_display?.toLowerCase().includes(searchTerm);
      const matchesAmount = Number(tx.amount).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).includes(searchTerm);
      const matchesStatus = tx.status_display?.toLowerCase().includes(searchTerm);
      const matchesDate = new Date(tx.created_at).toLocaleString().toLowerCase().includes(searchTerm);
      
      const matchesSearch = matchesReference || matchesType || matchesAmount || matchesStatus || matchesDate;
      const matchesTypeFilter = typeFilter === 'all' || tx.transaction_type === typeFilter;
      
      return matchesSearch && matchesTypeFilter;
    });

    const sorted = filtered.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return sorted;
  }, [transactions, debouncedSearch, typeFilter, sortOrder]);

  // Fetch transactions when authenticated
  useEffect(() => {
    if (authLoading) return; // wait for auth check
    if (!isAuthenticated) {
      setTransactions([]);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      const startTime = Date.now();
      
      try {
        const response = await api.get(ENDPOINTS.TRANSACTIONS);
        const res = response.data;
        
        // Ensure minimum 10 seconds loading time
        const timeElapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 10000 - timeElapsed);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        // Backend may return {deposits: [], withdrawals: []} or a flat array
        let items: any[] = [];
        if (Array.isArray(res)) {
          items = res;
        } else if (res && ('deposits' in res || 'withdrawals' in res)) {
          const deps = (res as any).deposits || [];
          const wds = (res as any).withdrawals || [];
          // normalize and combine
          items = [
            ...deps.map((i: any) => ({ ...i, transaction_type: 'deposit' })),
            ...wds.map((i: any) => ({ ...i, transaction_type: 'withdrawal' })),
          ];
        } else if (res && 'results' in res && Array.isArray((res as any).results)) {
          items = (res as any).results;
        }

        const normalized: Transaction[] = items.map((it: any) => ({
          id: String(it.id ?? it.pk ?? it.reference ?? Math.random()),
          reference: it.reference ?? String(it.id ?? ''),
          transaction_type: it.transaction_type ?? (it.type ?? 'deposit'),
          transaction_type_display: it.transaction_type_display ?? (it.transaction_type ? (it.transaction_type.charAt(0).toUpperCase() + it.transaction_type.slice(1)) : (it.type ?? '')),
          amount: String(it.amount ?? it.total ?? it.value ?? 0),
          status: it.status ?? (it.state ?? 'unknown'),
          status_display: it.status_display ?? (it.status ? (it.status.charAt(0).toUpperCase() + it.status.slice(1)) : ''),
          created_at: it.created_at ?? it.created ?? it.timestamp ?? new Date().toISOString(),
        }));

        if (mounted) setTransactions(normalized);
      } catch (err) {
        console.error('Failed to load transactions', err);
        const msg = err instanceof APIError ? err.message : 'Could not load transactions';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading]);

  if (loading) {
    return <DashboardLoading message="Loading transactions..." />;
  }

  return (
    <div className="space-y-6 w-full max-w-full px-2 sm:px-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowUpDown size={16} />
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple [&>option]:py-2 [&>option]:px-3 [&_option:checked]:bg-muted [&>option:hover]:bg-muted/50"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits Only</option>
          <option value="withdrawal">Withdrawals Only</option>
        </select>
      </div>

      {/* Results count / status */}
      <div className="text-sm text-muted-foreground">
        {authLoading ? (
          'Checking authentication...'
        ) : !isAuthenticated ? (
          'Please log in to view your transactions.'
        ) : loading ? (
          'Loading transactions...'
        ) : error ? (
          `Error: ${error}`
        ) : (
          <>Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 && 's'}</>
        )}
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-lg border border-border max-w-[calc(100vw-2rem)] md:max-w-full [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-background [&::-webkit-scrollbar-thumb]:bg-muted hover:[&::-webkit-scrollbar-thumb]:bg-muted/80 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <table className="w-[800px] md:w-full text-sm border-separate border-spacing-0">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Reference</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <tr key={`${tx.transaction_type}_${tx.id}`} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{tx.reference}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      tx.transaction_type === 'deposit'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {tx.transaction_type_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'successful'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
