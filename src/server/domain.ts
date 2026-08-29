export const CATEGORIES = ['食費', '日用品', '交通', '住居', '光熱費', '通信', '娯楽', '医療', '教育', 'その他', '給与', '臨時収入'] as const;
export type TransactionType = 'income' | 'expense';

export type TransactionInput = { date: string; type: TransactionType; amount: number; category: string; memo?: string };
export type TransactionLike = TransactionInput & { id: number };

export function validateTransaction(input: unknown): { value?: TransactionInput; error?: string } {
  const data = input as Partial<TransactionInput>;
  if (!data || typeof data !== 'object') return { error: '入力内容が正しくありません。' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date ?? '') || Number.isNaN(Date.parse(`${data.date}T00:00:00`))) return { error: '日付を入力してください。' };
  if (data.type !== 'income' && data.type !== 'expense') return { error: '種別を選択してください。' };
  const amount = data.amount;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) return { error: '金額は1円以上の整数で入力してください。' };
  if (typeof data.category !== 'string' || !CATEGORIES.includes(data.category as typeof CATEGORIES[number])) return { error: 'カテゴリを選択してください。' };
  if (data.memo !== undefined && typeof data.memo !== 'string') return { error: 'メモの形式が正しくありません。' };
  return { value: { date: data.date!, type: data.type, amount, category: data.category, memo: data.memo?.trim() || undefined } };
}

export function isMonth(value: string | undefined): value is string { return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }

export function calculateSummary(rows: TransactionLike[]) {
  const income = rows.filter((row) => row.type === 'income').reduce((sum, row) => sum + row.amount, 0);
  const expense = rows.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0);
  const categoryMap = new Map<string, number>();
  rows.filter((row) => row.type === 'expense').forEach((row) => categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + row.amount));
  const categories = [...categoryMap.entries()].map(([category, amount]) => ({ category, amount, percentage: expense ? Math.round((amount / expense) * 1000) / 10 : 0 })).sort((a, b) => b.amount - a.amount);
  return { income, expense, balance: income - expense, categories };
}
