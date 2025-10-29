import { ArrowDownCircle, ArrowUpCircle, Clock, PlusCircle } from "lucide-react";

import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Overview() {
  const location = useLocation();
  const [flash, setFlash] = useState<string | null>(() => (location.state as any)?.flashMessage ?? null);
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
          <p className="mt-2 text-2xl font-bold text-primary">$12,540</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Deposit</h2>
          <p className="mt-2 text-2xl font-bold">5</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pending Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-destructive">3</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Deposits</h2>
          <p className="mt-2 text-2xl font-bold text-green-500">$8,400</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Total Withdrawals</h2>
          <p className="mt-2 text-2xl font-bold text-blue-500">$4,600</p>
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
              <tr className="border-b border-border">
                <td className="py-2">Deposit</td>
                <td className="py-2">Sep 20, 2025</td>
                <td className="py-2 text-green-500">Completed</td>
                <td className="py-2 text-right">$500</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2">Withdrawal</td>
                <td className="py-2">Sep 18, 2025</td>
                <td className="py-2 text-yellow-500">Pending</td>
                <td className="py-2 text-right">$200</td>
              </tr>
              <tr>
                <td className="py-2">Deposit</td>
                <td className="py-2">Sep 15, 2025</td>
                <td className="py-2 text-green-500">Completed</td>
                <td className="py-2 text-right">$1,000</td>
              </tr>
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
                  data: [1200, 1500, 1100, 1800, 1700, 2000, 2200, 2100, 1900, 2300, 2500, 2400],
                  borderColor: 'rgb(34,197,94)',
                  backgroundColor: 'rgba(34,197,94,0.15)',
                  borderWidth: 3,
                  tension: 0.45,
                  fill: true,
                  pointRadius: 0,
                },
                {
                  label: 'Withdrawals',
                  data: [800, 900, 700, 1200, 1000, 1300, 1400, 1200, 1100, 1500, 1600, 1550],
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
