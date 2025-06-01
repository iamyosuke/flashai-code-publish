# ベースイメージ
FROM oven/bun:1 as base

# 開発ステージ
FROM base AS development

WORKDIR /app

# 依存関係のインストール
COPY frontend/package.json frontend/bun.lock ./
RUN bun install

# ソースコードのコピー
COPY frontend/ .

# 開発サーバーの起動
CMD ["bun", "run", "dev"]

# ビルドステージ
FROM base AS builder

WORKDIR /app

# 依存関係のインストール
COPY frontend/package.json frontend/bun.lock ./
RUN bun install

# ソースコードのコピー
COPY frontend/ .

# アプリケーションのビルド
RUN bun run build

# 本番ステージ
FROM base AS production

WORKDIR /app

# ビルド成果物のコピー
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 本番用の依存関係のみインストール
RUN bun install --production

# 環境変数の設定
ENV NODE_ENV=production

# アプリケーションの起動
CMD ["bun", "run", "start"]
