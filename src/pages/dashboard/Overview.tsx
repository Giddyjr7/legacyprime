import { ArrowDownCircle, ArrowUpCircle, Clock, PlusCircle } from "lucide-react";

import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import FlashMessage from "@/components/FlashMessage";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Filler } from 'chart.js';
import { useAuth } from '@/context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function Overview() {
  const location = useLocation();
  const [flash, setFlash] = useState<string | null>(() => (location.state as any)?.flashMessage ?? null);
  const [summary, setSummary] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [transactions, setTransactions] = useState<{deposits:any[]; withdrawals:any[]}>({deposits:[], withdrawals:[]});

  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // wait for auth check
    if (!isAuthenticated) {
      // user not logged in — skip loading protected data
      setSummary(null);
      setPerformance(null);
      setTransactions({ deposits: [], withdrawals: [] });
      return;
    }

    const load = async () => {
      try {
        const s = await api.get(ENDPOINTS.DASHBOARD_SUMMARY);
        setSummary(s);
      } catch (err) {
        console.error('Failed loading summary', err);
      }
      try {
        const p = await api.get(ENDPOINTS.DASHBOARD_PERFORMANCE);
        setPerformance(p);
      } catch (err) {
        console.error('Failed loading performance', err);
      }
      try {
        const t = await api.get(`${ENDPOINTS.TRANSACTIONS}`);
        // API returns {deposits, withdrawals}
        setTransactions(t as any);
      } catch (err) {
        console.error('Failed loading transactions', err);
      }
    };
    load();
  }, [isAuthenticated, isLoading]);
  return (
    <>
      {flash && <FlashMessage message={flash} onClose={() => setFlash(null)} />}
    
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your investment dashboard. Track your balances, manage deposits and withdrawals, 
          and review your recent activity all in one place.
        </p>
      </div>

      {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Balance</h2>
          <p className="mt-2 text-2xl font-bold text-primary">{summary ? `$${Number(summary.total_balance).toLocaleString()}` : '$—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Deposit</h2>
          <p className="mt-2 text-2xl font-bold">{transactions.deposits.filter(d=>d.status==='pending').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-destructive">{transactions.withdrawals.filter(w=>w.status==='pending').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Deposits</h2>
          <p className="mt-2 text-2xl font-bold text-green-500">{summary ? `$${Number(summary.total_deposits).toLocaleString()}` : '$—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-blue-500">{summary ? `$${Number(summary.total_withdrawals).toLocaleString()}` : '$—'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/dashboard/deposit" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium transition hover:bg-muted text-green-500">
          <ArrowDownCircle size={18} /> Deposit Now
        </Link>
        <Link to="/dashboard/withdraw" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium transition hover:bg-muted text-yellow-500">
          <ArrowUpCircle size={18} /> Withdraw Now
        </Link>
        <Link to="/dashboard/transactions" className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-medium transition hover:bg-muted text-destructive">
          <Clock size={18} /> View Transactions
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left border-b border-border">
              <tr>
                <th className="py-2">Type</th>
                <th className="py-2">Date</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...transactions.deposits.slice(0,3).map(d=>({type:'Deposit', date:d.created_at, status:d.status, amount:d.amount})),
                ...transactions.withdrawals.slice(0,3).map(w=>({type:'Withdrawal', date:w.created_at, status:w.status, amount:w.amount})),
              ].slice(0,3).map((row, idx)=> (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2">{row.type}</td>
                  <td className="py-2">{new Date(row.date).toLocaleDateString()}</td>
                  <td className={`py-2 ${row.status==='approved' ? 'text-green-500' : row.status==='pending' ? 'text-yellow-500' : ''}`}>{row.status}</td>
                  <td className="py-2 text-right">${Number(row.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Performance */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Investment Performance</h2>
        </div>

        <div className="h-72">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [
                {
                  label: 'Deposits',
                  data: performance ? performance.deposits.map((p:any)=>Number(p.total)) : [1200, 1500, 1100, 1800, 1700, 2000, 2200, 2100, 1900, 2300, 2500, 2400],
                  borderColor: 'rgb(34,197,94)',
                  backgroundColor: 'rgba(34,197,94,0.15)',
                  borderWidth: 3,
                  tension: 0.45,
                  fill: true,
                  pointRadius: 0,
                },
                {
                  label: 'Withdrawals',
                  data: performance ? performance.withdrawals.map((p:any)=>Number(p.total)) : [800, 900, 700, 1200, 1000, 1300, 1400, 1200, 1100, 1500, 1600, 1550],
                  borderColor: 'rgb(59,130,246)',
                  backgroundColor: 'rgba(59,130,246,0.15)',
                  borderWidth: 3,
                  tension: 0.45,
                  fill: true,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, labels: { usePointStyle: true } },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#fff',
                  bodyColor: '#fff',
                  padding: 12,
                  displayColors: false,
                  borderColor: '#1e293b',
                  borderWidth: 1,
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#6b7280' },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(203,213,225,0.3)' },
                  ticks: { color: '#6b7280' },
                },
              },
            }}
          />
        </div>
      </div>

    </div>
    </>
  );
}
