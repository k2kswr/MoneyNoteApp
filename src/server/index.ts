import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { PrismaClient, TransactionType as PrismaTransactionType } from '@prisma/client';
import { calculateSummary, isMonth, validateTransaction } from './domain.js';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

function range(month: string) { const start = new Date(`${month}-01T00:00:00.000Z`); const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1); return { gte: start, lt: end }; }
function serialize(row: { id: number; date: Date; type: string; amount: number; category: string; memo: string | null }) { return { ...row, date: row.date.toISOString().slice(0, 10) }; }

app.get('/api/transactions', async (req, res, next) => {
  try { const month = req.query.month as string; if (!isMonth(month)) return res.status(400).json({ error: 'month は YYYY-MM 形式で指定してください。' });
    const rows = await prisma.transaction.findMany({ where: { date: range(month) }, orderBy: [{ date: 'desc' }, { id: 'desc' }] }); return res.json(rows.map(serialize)); } catch (error) { next(error); }
});
app.post('/api/transactions', async (req, res, next) => {
  try { const result = validateTransaction(req.body); if (result.error) return res.status(400).json({ error: result.error }); const data = result.value!;
    const row = await prisma.transaction.create({ data: { ...data, date: new Date(`${data.date}T00:00:00.000Z`), type: data.type as PrismaTransactionType } }); return res.status(201).json(serialize(row)); } catch (error) { next(error); }
});
app.put('/api/transactions/:id', async (req, res, next) => {
  try { const id = Number(req.params.id); const result = validateTransaction(req.body); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'IDが正しくありません。' }); if (result.error) return res.status(400).json({ error: result.error }); const data = result.value!;
    const row = await prisma.transaction.update({ where: { id }, data: { ...data, date: new Date(`${data.date}T00:00:00.000Z`), type: data.type as PrismaTransactionType } }); return res.json(serialize(row)); } catch (error: any) { if (error.code === 'P2025') return res.status(404).json({ error: '取引が見つかりません。' }); next(error); }
});
app.delete('/api/transactions/:id', async (req, res, next) => { try { const id = Number(req.params.id); if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'IDが正しくありません。' }); await prisma.transaction.delete({ where: { id } }); return res.status(204).end(); } catch (error: any) { if (error.code === 'P2025') return res.status(404).json({ error: '取引が見つかりません。' }); next(error); } });
app.get('/api/summary', async (req, res, next) => { try { const month = req.query.month as string; if (!isMonth(month)) return res.status(400).json({ error: 'month は YYYY-MM 形式で指定してください。' }); const rows = await prisma.transaction.findMany({ where: { date: range(month) } }); return res.json(calculateSummary(rows.map((row) => ({ ...serialize(row), type: row.type as 'income' | 'expense', memo: row.memo ?? undefined })))); } catch (error) { next(error); } });
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ error: 'サーバーエラーが発生しました。' }); });

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API server listening on ${port}`));
