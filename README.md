# 古事記を読む（Webサイト）

`doc/` にある青空文庫形式のテキストをもとに、**古事記を楽しめる閲覧用Webサイト**を生成します。

- **校註（書き下し＋注）**・**現代語譯**・**古事記物語**・**解説**・**凡例**・**索引**を1つのサイトに統合
- `《ルビ》` を `<ruby>` に変換して表示（表示ON/OFFあり）
- `manga/上/` の漫画（上巻）を該当章の直後に自動挿入
- `movie/` の紹介動画をサイトに配置し、`#/movie` で再生/ダウンロード

## デモ（ローカル起動）

Node.js（推奨: 18+）が必要です。

```bash
npm install
npm run dev
```

ブラウザで表示されたURL（例: `http://localhost:5173`）を開きます。

### 本番ビルド

```bash
npm run build
npm run preview
```

生成物は `dist/` に出力されます。

## データ生成の仕組み

- **入力**: `doc/*.txt`（UTF-8、青空文庫形式）
- **変換**: `scripts/build-data.mjs`
- **出力**: `web/public/data/*.json`

ビルド/起動時に `npm run data` が走り、`doc/` を読み直して JSON を再生成します。

## 漫画（上巻）の配置

`manga/上/*.png` を `web/public/manga/ue/` にコピーし、校註（`#/kochu/jo-ue`）と現代語譯（`#/gendaigo/jo-ue`）の上巻に挿入します。

対応表は `scripts/build-data.mjs` の `KOCHU_UE_MANGA` / `GENDAIGO_UE_MANGA` を参照してください。

## 紹介動画の配置

`movie/` 配下の最初の `.mp4` を検出して、ビルド時に以下へコピーします。

- `web/public/movie/kojiki-intro.mp4`（ビルド後は `dist/movie/kojiki-intro.mp4`）

サイト上では `#/movie` で再生できます。

## ディレクトリ構成（要点）

- `doc/` … テキスト資料（校註・現代語譯・解説・索引など）
- `manga/` … 漫画素材（上巻など）
- `movie/` … 紹介動画
- `scripts/build-data.mjs` … テキスト→JSON・漫画/動画のコピー・挿入
- `web/` … フロントエンド（Vite）
- `dist/` … ビルド出力（gitignore）

## 注意（GitHub上の大きいファイル）

`movie/*.mp4` はサイズが大きく、GitHub では **Git LFS** 利用が推奨されることがあります。
必要なら `.mp4` を LFS 管理に移行するか、Release/外部ストレージに置く運用に変更できます。

## ライセンス/出典

テキストは青空文庫の入力データ（角川文庫・武田祐吉校註ほか）を UTF-8 に整え、非営利の閲覧用に再構成したものです。

