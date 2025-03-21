# podcast-tiktok-BE
podcast tiktokのBEサーバーです。

## 🚀 セットアップ手順

### 1. リポジトリをクローン

```sh
git clone https://github.com/sugamass/podcast-tiktok-BE.git
```
### 2. 依存パッケージのインストール

```sh
npm install
```

### 3. DBの構築
dockerを使ってpostgresqlを立ち上げます。
dockerコンテナを起動
```sh
docker-compose up -d
```

### 4. envファイルの設定

プロジェクトのルートディレクトリに .env ファイルを作成し、以下のように記述します。各API keyは、各サービスのHPで取得する必要があります。
```sh
export PG_USER="user"
export PG_PASSWORD="password"
export PG_HOST="localhost"
export PG_PORT="5432"
export PG_DATABASE="database"

export OPENAI_API_KEY=xxxx
export NIJIVOICE_API_KEY=xxxx

export TAVILY_API_KEY=xxxx
```

環境変数の読み込み
```sh
source .env
```

### 5. サーバーの起動
```sh
npx ts-node -r tsconfig-paths/register src/main.ts
```

サーバーが正常に起動すると、デフォルトで http://localhost:3000 で API が利用可能になります。
