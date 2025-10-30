import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z.string().min(1),
  price: z.string(),
  quantity: z.string(),
});

export const ReceiptSchema = z.object({
  items: z.array(ReceiptItemSchema),
  total: z.string(),
  date: z.string(),
  time: z.string(),
  imageData: z.string().optional(),
  store: z.string().optional(),
  address: z.string().optional(),
  processedAt: z.string().optional(),
  source: z.string().optional(),
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;

export const DatabaseReceiptSchema = z.object({
  id: z.string(),
  items: z.array(
    ReceiptItemSchema.extend({
      id: z.string(),
    }),
  ),
  total: z.string(),
  date: z.string(),
  time: z.string(),
  imageData: z.string().optional(),
  store: z.string().optional(),
  address: z.string().optional(),
  processedAt: z.string().optional(),
  source: z.string().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type DatabaseReceipt = z.infer<typeof DatabaseReceiptSchema>;

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  receiptId?: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}
