import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { api, APIError } from '@/utils/api';
import { ENDPOINTS } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

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
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(tx => {
      const matchesSearch = tx.reference?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
      return matchesSearch && matchesType;
    });

    const sorted = filtered.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return sorted;
  }, [transactions, search, typeFilter, sortOrder]);

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
      try {
        const res = await api.get<any>(ENDPOINTS.TRANSACTIONS);

        // Backend may return {deposits: [], withdrawals: []} or a flat array
        let items: any[] = [];
        if (res && Array.isArray(res)) {
          items = res;
        } else if (res && (res.deposits || res.withdrawals)) {
          const deps = res.deposits || [];
          const wds = res.withdrawals || [];
          // normalize and combine
          items = [
            ...deps.map((i: any) => ({ ...i, transaction_type: 'deposit' })),
            ...wds.map((i: any) => ({ ...i, transaction_type: 'withdrawal' })),
          ];
        } else if (res && res.results && Array.isArray(res.results)) {
          items = res.results;
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

  return (
    <div className="space-y-6 p-4 md:p-6">
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
          className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-crypto-purple"
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
      <div className="overflow-x-auto rounded-lg border border-border">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <table className="min-w-full text-sm border-separate border-spacing-0">
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
                <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
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
