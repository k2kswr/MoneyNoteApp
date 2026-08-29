# Money Note — シンプル家計簿アプリ

日々の収入・支出を記録し、月ごとの収支とカテゴリ別の支出傾向を確認できる単一ユーザー向けのWebアプリケーションです。

「入力しやすさ」と「その月のお金の流れをすぐ把握できること」を重視して、1ページのダッシュボードとして設計・実装しました。

## 主な機能

- 収入・支出の登録（日付、種別、金額、カテゴリ、任意メモ）
- 記録の編集・削除（削除時の確認付き）
- 対象月の切り替えと、月別の記録一覧
- 収入・支出・収支の月次サマリー
- カテゴリ別支出の金額・割合表示
- 必須項目、日付、金額、カテゴリのサーバー側バリデーション

## 技術スタック

| 分類 | 使用技術 |
| --- | --- |
| フロントエンド | React / TypeScript / Vite |
| バックエンド | Node.js / Express / TypeScript |
| データベース | PostgreSQL 16 |
| ORM・マイグレーション | Prisma |
| 開発環境 | Docker Compose / pnpm |
| テスト | Vitest |

## 設計のポイント

### 役割を分けた構成

- Reactはフォーム操作・月別表示・集計結果の表示を担当します。
- ExpressはREST APIと入力値の検証を担当します。
- Prismaを介してPostgreSQLへアクセスし、スキーマとマイグレーションをコードで管理します。

### API

| メソッド | エンドポイント | 内容 |
| --- | --- | --- |
| `GET` | `/api/transactions?month=YYYY-MM` | 指定月の取引一覧を取得 |
| `POST` | `/api/transactions` | 取引を登録 |
| `PUT` | `/api/transactions/:id` | 取引を更新 |
| `DELETE` | `/api/transactions/:id` | 取引を削除 |
| `GET` | `/api/summary?month=YYYY-MM` | 月次収支・カテゴリ別支出を取得 |

### データモデル

`Transaction` テーブルで、ID・日付・収入/支出種別・金額（円）・カテゴリ・任意メモ・作成/更新日時を管理します。金額は小数の誤差を避けるため、円単位の整数で保存しています。

## ローカル起動手順

### 前提条件

- Node.js 22以降
- pnpm 11以降
- Docker Desktop

### 1. 環境変数を設定

```powershell
Copy-Item .env.example .env
```

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

ブラウザで [http://localhost:5173](http://localhost:5173) を開きます。APIサーバーは `http://localhost:3000` で起動します。

## データベースを確認する

Prisma Studioを使うと、ブラウザで `Transaction` テーブルを閲覧・編集できます。

```powershell
pnpm exec prisma studio
```

通常は [http://localhost:5555](http://localhost:5555) が開きます。

## テスト・ビルド

```powershell
pnpm test
pnpm build
```

テストでは、取引の入力検証と収入・支出・カテゴリ別集計ロジックを検証しています。

## 今後の拡張案

- ユーザー認証とユーザーごとのデータ分離
- 月別・カテゴリ別の予算設定と達成率表示
- CSVのインポート・エクスポート
- 支払い方法（現金・クレジットカードなど）の管理
- 月ごとの推移を可視化するグラフ
