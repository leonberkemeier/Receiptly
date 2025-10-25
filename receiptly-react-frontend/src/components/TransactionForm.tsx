import React, { useState } from 'react';
import { TransactionCreate } from '../types';

interface TransactionFormProps {
  onSubmit: (transaction: TransactionCreate) => Promise<void>;
  onCancel?: () => void;
}

const COMMON_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other Income',
];

const COMMON_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Utilities',
  'Rent',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Insurance',
  'Other Expense',
];

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === 'income' ? COMMON_INCOME_CATEGORIES : COMMON_EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    setSubmitting(true);
    try {
      const transactionData: TransactionCreate = {
        type,
        amount: amountNum,
        category,
        description: description || undefined,
        date: new Date(date).toISOString(),
      };

      await onSubmit(transactionData);

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Add New Transaction</h2>
        
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Type</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="type"
                  className="radio radio-success"
                  checked={type === 'income'}
                  onChange={() => {
                    setType('income');
                    setCategory('');
                  }}
                />
                <span className="label-text">Income</span>
              </label>
              <label className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="type"
                  className="radio radio-error"
                  checked={type === 'expense'}
                  onChange={() => {
                    setType('expense');
                    setCategory('');
                  }}
                />
                <span className="label-text">Expense</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Amount</span>
            </label>
            <label className="input input-bordered flex items-center gap-2">
              <span className="text-base-content/60">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="grow"
                required
              />
            </label>
          </div>

          {/* Category */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Category</span>
            </label>
            <select
              className="select select-bordered"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description (optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-20"
              placeholder="Add notes about this transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="card-actions justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`btn ${type === 'income' ? 'btn-success' : 'btn-error'}`}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Adding...
                </>
              ) : (
                `Add ${type === 'income' ? 'Income' : 'Expense'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
