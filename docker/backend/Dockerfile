# ビルドステージ
# docker build -t ai-flashcards-backend -f docker/backend/Dockerfile .
FROM golang:1.23-alpine AS builder

WORKDIR /app

# 依存関係のインストール
RUN apk add --no-cache gcc musl-dev

# ビルド引数の定義
ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG COMMIT_MESSAGE=unknown

# go.mod と go.sum をコピー
COPY go.mod go.sum ./

# モジュールのダウンロード
RUN go mod download

# ソースコードのコピー
COPY . .

# アプリケーションのビルド（ビルド時にバージョン情報を埋め込み）
# commit messageの特殊文字をエスケープするため、シェル変数を使用
RUN ESCAPED_MESSAGE=$(printf '%s' "${COMMIT_MESSAGE}" | sed 's/"/\\"/g' | sed "s/'/\\'/g") && \
    GOOS=linux GOARCH=amd64 go build \
    -ldflags "-X 'main.Version=${VERSION}' -X 'main.GitCommit=${GIT_COMMIT}' -X 'main.BuildTime=${BUILD_TIME}' -X 'main.CommitMessage=${ESCAPED_MESSAGE}'" \
    -o main .

# 実行ステージ
FROM alpine:latest

WORKDIR /app

# 必要なパッケージのインストール
RUN apk add --no-cache tzdata ca-certificates

# マイグレーションツールのインストール
RUN wget https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz && \
    tar xvzf migrate.linux-amd64.tar.gz && \
    mv migrate /usr/local/bin/migrate && \
    rm migrate.linux-amd64.tar.gz

# ビルドしたバイナリのコピー
COPY --from=builder /app/main .
COPY migrations ./migrations

# タイムゾーンの設定
ENV TZ=Asia/Tokyo

# 実行権限の設定
RUN chmod +x /app/main

EXPOSE 8080

# アプリケーションの実行
CMD ["./main"]
