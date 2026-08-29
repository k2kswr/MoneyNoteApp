# Money Note — シンプル家計簿アプリ

日々の収入・支出を記録し、月ごとの収支とカテゴリ別の支出傾向を確認できる家計簿アプリです。Google アカウントでログインしたユーザーごとに、取引データを安全に分離します。

## 主な機能

- Google ログイン／ログアウト（Firebase Authentication）
- ユーザーごとに分離された取引の登録・編集・削除
- 対象月の切り替えと、月別の取引一覧
- 収入・支出・収支の月次サマリー
- カテゴリ別支出の金額・割合表示
- 必須項目、日付、金額、カテゴリのサーバー側バリデーション

## 技術スタック

| 分類 | 使用技術 |
| --- | --- |
| フロントエンド | React / TypeScript / Vite |
| 認証 | Firebase Authentication（Google ログイン） |
| バックエンド | Node.js / Express / TypeScript |
| データベース | Neon PostgreSQL |
| ORM・マイグレーション | Prisma |
| ホスティング | Vercel |
| 開発環境 | Docker Compose / pnpm |
| テスト | Vitest |

## 認証とデータ分離

Firebase Authentication で発行される ID トークンを API で検証します。すべての API は認証必須で、未ログイン時は `401 Unauthorized` を返します。

`Transaction` テーブルは Firebase の UID を `userId` として保存し、取引一覧・集計・作成・更新・削除の全操作でログイン中ユーザーの `userId` に限定します。これにより、他ユーザーの取引へアクセスできません。

## API

すべての API に `Authorization: Bearer <Firebase ID Token>` が必要です。

| メソッド | エンドポイント | 内容 |
| --- | --- | --- |
| `GET` | `/api/transactions?month=YYYY-MM` | ログイン中ユーザーの指定月の取引一覧 |
| `POST` | `/api/transactions` | 取引を登録 |
| `PUT` | `/api/transactions/:id` | 自分の取引を更新 |
| `DELETE` | `/api/transactions/:id` | 自分の取引を削除 |
| `GET` | `/api/summary?month=YYYY-MM` | ログイン中ユーザーの月次収支・カテゴリ別支出 |

## ローカル起動手順

### 前提条件

- Node.js 22以降
- pnpm 11以降
- Docker Desktop
- Firebase プロジェクト（Google ログインを有効化）

### 1. 環境変数を設定

```powershell
Copy-Item .env.example .env
```

`.env` に Firebase Web アプリの設定値を入力します。Firebase Console の Authentication で Google を有効にし、`localhost` を Authorized domains に追加してください。

### 2. PostgreSQLを起動

```powershell
docker compose up -d
```

### 3. 依存関係・データベースを準備

```powershell
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

### 4. アプリを起動

```powershell
pnpm dev
```

[http://localhost:5173](http://localhost:5173) を開き、Google アカウントでログインします。API サーバーは `http://localhost:3000` で起動します。

## 本番環境

Vercel では、Firebase Web アプリの公開設定を次の環境変数として登録します。

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
```

Firebase Console の **Authentication → Settings → Authorized domains** に、本番 URL の `moneynoteapp.vercel.app` を追加してください。

## データベースを確認する

Prisma Studioを使うと、ローカルの `Transaction` テーブルを閲覧・編集できます。

```powershell
pnpm exec prisma studio
```

通常は [http://localhost:5555](http://localhost:5555) が開きます。本番データは Neon Console の SQL Editor から確認できます。

## テスト・ビルド

```powershell
pnpm test
pnpm build
```

テストでは、取引の入力検証と収入・支出・カテゴリ別集計ロジックを検証しています。

## 今後の拡張案

- 月別・カテゴリ別の予算設定と達成率表示
- CSVのインポート・エクスポート
- 支払い方法（現金・クレジットカードなど）の管理
- 月ごとの推移を可視化するグラフ