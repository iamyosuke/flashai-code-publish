#!/bin/bash

# 機密情報を削除して公開リポジトリに公開するスクリプト

# 現在のディレクトリのファイルを全て削除
rm -rf * .*

# 元のリポジトリをクローン
git clone https://github.com/iamyosuke/ai-flashcards.git .

# 機密情報を含むファイルを削除
rm -rf secret/ terraform.tfstate terraform/terraform.tfvars

# .gitディレクトリを削除し、新しいGitリポジトリを初期化
rm -rf .git && git init

# 全てのファイルをステージングし、初期コミットを作成
git add .
git commit -m "Initial commit: Clean repository for public release"

# 公開リポジトリをリモートとして追加
git remote add origin https://github.com/iamyosuke/flashai-code-publish.git

# 強制的にプッシュ
git push -f origin main

echo "機密情報を削除したコードが公開リポジトリに公開されました。"
