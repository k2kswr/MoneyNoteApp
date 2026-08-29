import { describe, expect, it } from 'vitest';
import { calculateSummary, validateTransaction } from './domain.js';

describe('validateTransaction', () => {
  it('accepts a valid transaction', () => expect(validateTransaction({ date: '2026-08-01', type: 'expense', amount: 500, category: '食費' }).value?.amount).toBe(500));
  it('rejects zero amount and unknown category', () => { expect(validateTransaction({ date: '2026-08-01', type: 'expense', amount: 0, category: '食費' }).error).toBeTruthy(); expect(validateTransaction({ date: '2026-08-01', type: 'income', amount: 1, category: '不明' }).error).toBeTruthy(); });
});
describe('calculateSummary', () => it('calculates balances and expense categories', () => { const result = calculateSummary([{ id: 1, date: '2026-08-01', type: 'income', amount: 10000, category: '給与' }, { id: 2, date: '2026-08-02', type: 'expense', amount: 3000, category: '食費' }, { id: 3, date: '2026-08-03', type: 'expense', amount: 1000, category: '交通' }]); expect(result).toMatchObject({ income: 10000, expense: 4000, balance: 6000 }); expect(result.categories[0]).toMatchObject({ category: '食費', percentage: 75 }); }));
