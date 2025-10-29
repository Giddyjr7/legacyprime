import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

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

const staticTransactions: Transaction[] = [
  {
    id: '1',
    reference: 'REF123',
    transaction_type: 'deposit',
    transaction_type_display: 'Deposit',
    amount: '100.00',
    status: 'successful',
    status_display: 'Successful',
    created_at: '2025-10-28T12:00:00Z',
  },
  {
    id: '2',
    reference: 'REF124',
    transaction_type: 'withdrawal',
    transaction_type_display: 'Withdrawal',
    amount: '50.00',
    status: 'pending',
    status_display: 'Pending',
    created_at: '2025-10-28T13:00:00Z',
  },
  // Add more static transactions as needed
];

export default function Transactions() {
  const transactions = staticTransactions;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.reference.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.transaction_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

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

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 && 's'}
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
