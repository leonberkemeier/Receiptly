import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TransactionForm from './TransactionForm';
import { Transaction, TransactionCreate, TransactionStats, MonthlyStats } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

const Tracker: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch transactions
      const transactionsRes = await fetch(`${API_BASE_URL}/api/transactions/?limit=100`, {
        headers,
      });
      if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
      const transactionsData = await transactionsRes.json();

      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/api/transactions/stats`, {
        headers,
      });
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();

      // Fetch monthly stats
      const monthlyRes = await fetch(`${API_BASE_URL}/api/transactions/monthly?months=6`, {
        headers,
      });
      if (!monthlyRes.ok) throw new Error('Failed to fetch monthly stats');
      const monthlyData = await monthlyRes.json();

      setTransactions(transactionsData);
      setStats(statsData);
      setMonthlyStats(monthlyData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (transactionData: TransactionCreate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) throw new Error('Failed to create transaction');

      await fetchData();
      setShowForm(false);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete transaction');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'short' });
  };

  const getAvailableMonths = () => {
    if (transactions.length === 0) return [];

    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });

    return Array.from(months).sort().reverse();
  };

  const getDailyChartData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentMonth = month - 1; // JS months are 0-indexed
    const currentYear = year;
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Group by day
    const dailyData: Record<string, { income: number; expenses: number }> = {};
    
    currentMonthTransactions.forEach(t => {
      const date = new Date(t.date);
      const day = date.getDate();
      const key = `${day}`;
      
      if (!dailyData[key]) {
        dailyData[key] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        dailyData[key].income += t.amount;
      } else {
        dailyData[key].expenses += t.amount;
      }
    });

    // Convert to array and sort by day
    return Object.keys(dailyData)
      .map(day => ({
        day: `Day ${day}`,
        Income: dailyData[day].income,
        Expenses: -dailyData[day].expenses, // Negative for expenses
      }))
      .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));
  };

  const getNetBalanceData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentMonth = month - 1; // JS months are 0-indexed
    const currentYear = year;
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Sort by date
    const sortedTransactions = [...currentMonthTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate cumulative balance by day
    const dailyBalance: Record<number, number> = {};
    let cumulativeBalance = 0;

    sortedTransactions.forEach(t => {
      const date = new Date(t.date);
      const day = date.getDate();
      
      if (t.type === 'income') {
        cumulativeBalance += t.amount;
      } else {
        cumulativeBalance -= t.amount;
      }
      
      dailyBalance[day] = cumulativeBalance;
    });

    // Convert to array format
    return Object.keys(dailyBalance)
      .map(day => ({
        day: `Day ${day}`,
        Balance: dailyBalance[parseInt(day)],
      }))
      .sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Tracker</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Add Transaction
        </button>
      </div>

      {/* Transaction Modal */}
      <dialog className={`modal ${showForm ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <TransactionForm
            onSubmit={handleCreateTransaction}
            onCancel={() => setShowForm(false)}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowForm(false)}>close</button>
        </form>
      </dialog>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Total Income</div>
            <div className="stat-value text-success">{formatCurrency(stats.totalIncome)}</div>
            <div className="stat-desc">{stats.incomeCount} transactions</div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Total Expenses</div>
            <div className="stat-value text-error">{formatCurrency(stats.totalExpenses)}</div>
            <div className="stat-desc">{stats.expenseCount} transactions</div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-lg">
            <div className="stat-title">Net Balance</div>
            <div className={`stat-value ${stats.netBalance >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(stats.netBalance)}
            </div>
            <div className="stat-desc">{stats.transactionCount} total transactions</div>
          </div>
        </div>
      )}

      {/* Month Selector */}
      {transactions.length > 0 && getAvailableMonths().length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <label className="label">
                <span className="label-text font-semibold">Select Month:</span>
              </label>
              <select 
                className="select select-bordered w-full max-w-xs"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {getAvailableMonths().map(monthKey => {
                  const [year, month] = monthKey.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return (
                    <option key={monthKey} value={monthKey}>
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Daily Chart for Selected Month */}
      {transactions.length > 0 && getDailyChartData().length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              Daily Income vs Expenses - {(() => {
                const [year, month] = selectedMonth.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              })()}
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getDailyChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="day" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827',
                    }}
                  />
                  <Legend wrapperStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Net Balance Development Chart */}
      {transactions.length > 0 && getNetBalanceData().length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              Net Balance Development - {(() => {
                const [year, month] = selectedMonth.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              })()}
            </h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getNetBalanceData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="day" stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#4b5563'} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '0.5rem',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827',
                    }}
                  />
                  <Legend wrapperStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Balance" 
                    stroke={theme === 'dark' ? '#60a5fa' : '#3b82f6'} 
                    strokeWidth={3}
                    dot={{ fill: theme === 'dark' ? '#60a5fa' : '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Overview Table */}
      {monthlyStats.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Monthly Overview</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-right">Income</th>
                    <th className="text-right">Expenses</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat) => (
                    <tr key={`${stat.year}-${stat.month}`}>
                      <td>{getMonthName(stat.month)} {stat.year}</td>
                      <td className="text-right text-success">{formatCurrency(stat.totalIncome)}</td>
                      <td className="text-right text-error">{formatCurrency(stat.totalExpenses)}</td>
                      <td className={`text-right font-bold ${stat.netBalance >= 0 ? 'text-success' : 'text-error'}`}>
                        {formatCurrency(stat.netBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Recent Transactions</h2>
            <div className="tabs tabs-boxed">
              <a
                className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </a>
              <a
                className={`tab ${filter === 'income' ? 'tab-active' : ''}`}
                onClick={() => setFilter('income')}
              >
                Income
              </a>
              <a
                className={`tab ${filter === 'expense' ? 'tab-active' : ''}`}
                onClick={() => setFilter('expense')}
              >
                Expenses
              </a>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <p>No transactions yet. Add your first transaction to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className={`badge ${transaction.type === 'income' ? 'badge-success' : 'badge-error'} badge-sm`}>
                            {transaction.type}
                          </div>
                          {transaction.category}
                        </div>
                      </td>
                      <td className="max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {transaction.description || '-'}
                          {transaction.receiptId && (
                            <a
                              href={`/receipts/${transaction.receiptId}`}
                              className="btn btn-ghost btn-xs gap-1"
                              title="View Receipt"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/receipts/${transaction.receiptId}`;
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Receipt
                            </a>
                          )}
                        </div>
                      </td>
                      <td className={`text-right font-bold ${transaction.type === 'income' ? 'text-success' : 'text-error'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracker;
