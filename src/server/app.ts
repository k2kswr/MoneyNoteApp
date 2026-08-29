import 'dotenv/config';
import { PrismaClient, TransactionType } from '../generated/prisma/index.js';
import cors from 'cors';
import express from 'express';
import { calculateSummary, isMonth, validateTransaction } from './domain.js';

let prisma: PrismaClient | undefined;
function db() { return prisma ??= new PrismaClient(); }
const app = express();
app.use(cors());
app.use(express.json());

let firebaseJwks: any;
async function firebaseUserId(token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID が設定されていません。');
  const { createRemoteJWKSet, jwtVerify } = await import('jose');
  firebaseJwks ??= createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
  const { payload } = await jwtVerify(token, firebaseJwks, { audience: projectId, issuer: `https://securetoken.google.com/${projectId}` });
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Firebase token does not contain a subject.');
  return payload.sub;
}
function range(month: string) { const start = new Date(`${month}-01T00:00:00.000Z`); const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1); return { gte: start, lt: end }; }
function serialize(row: { id: number; date: Date; type: string; amount: number; category: string; memo: string | null }) { return { ...row, date: row.date.toISOString().slice(0, 10) }; }

async function userIdFor(req: express.Request, res: express.Response) {
  const token = req.header('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) { res.status(401).json({ error: 'ログインが必要です。' }); return null; }
  try { return await firebaseUserId(token); } catch (error) { console.error('Firebase token verification failed', error); res.status(401).json({ error: 'ログイン情報が無効です。' }); return null; }
}

app.get('/api/transactions', async (req, res, next) => { try { const userId = await userIdFor(req, res); const month = req.query.month as string; if (!userId) return; if (!isMonth(month)) return res.status(400).json({ error: 'month は YYYY-MM 形式で指定してください。' }); const rows = await (await db()).transaction.findMany({ where: { userId, date: range(month) }, orderBy: [{ date: 'desc' }, { id: 'desc' }] }); return res.json(rows.map(serialize)); } catch (error) { next(error); } });
app.post('/api/transactions', async (req, res, next) => { try { const userId = await userIdFor(req, res); const result = validateTransaction(req.body); if (!userId) return; if (result.error) return res.status(400).json({ error: result.error }); const data = result.value!; const row = await (await db()).transaction.create({ data: { ...data, userId, date: new Date(`${data.date}T00:00:00.000Z`), type: data.type } }); return res.status(201).json(serialize(row)); } catch (error) { next(error); } });
app.put('/api/transactions/:id', async (req, res, next) => { try { const userId = await userIdFor(req, res); const id = Number(req.params.id); const result = validateTransaction(req.body); if (!userId) return; if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'IDが正しくありません。' }); if (result.error) return res.status(400).json({ error: result.error }); const existing = await (await db()).transaction.findFirst({ where: { id, userId } }); if (!existing) return res.status(404).json({ error: '取引が見つかりません。' }); const data = result.value!; const row = await (await db()).transaction.update({ where: { id }, data: { ...data, date: new Date(`${data.date}T00:00:00.000Z`), type: data.type } }); return res.json(serialize(row)); } catch (error) { next(error); } });
app.delete('/api/transactions/:id', async (req, res, next) => { try { const userId = await userIdFor(req, res); const id = Number(req.params.id); if (!userId) return; if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'IDが正しくありません。' }); const deleted = await (await db()).transaction.deleteMany({ where: { id, userId } }); if (deleted.count === 0) return res.status(404).json({ error: '取引が見つかりません。' }); return res.status(204).end(); } catch (error) { next(error); } });
app.get('/api/summary', async (req, res, next) => { try { const userId = await userIdFor(req, res); const month = req.query.month as string; if (!userId) return; if (!isMonth(month)) return res.status(400).json({ error: 'month は YYYY-MM 形式で指定してください。' }); const rows = await (await db()).transaction.findMany({ where: { userId, date: range(month) } }); return res.json(calculateSummary(rows.map((row) => ({ ...serialize(row), type: row.type as 'income' | 'expense', memo: row.memo ?? undefined })))); } catch (error) { next(error); } });
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error); res.status(500).json({ error: 'サーバーエラーが発生しました。' }); });

export default app;