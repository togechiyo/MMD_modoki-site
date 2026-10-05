# MMD_modoki ユーザーサイト

MMD_modokiのダウンロードと5言語の使い方ガイドです。本体とは独立したAstroの静的サイトです。

- 公開サイト：https://togechiyo.github.io/MMD_modoki-site/
- アプリ本体：https://github.com/togechiyo/MMD_modoki
- トップ、ダウンロード、入門、操作マニュアル、FAQ、制作手順、エフェクト、形式、用語・パラメータ辞典の全9ページ。
- 日本語は既存URL、Englishは `en/`、繁體中文は `zh-Hant/`、简体中文は `zh-Hans/`、한국어は `ko/`。9ページ × 5言語の全45ページです。
- 言語切替は同じページと見出し位置を保持します。自動的な言語転送は行いません。

## 開発と検証

Node.js 24で npm ci を実行し、npm run dev で起動します。
ビルドは npm run build、確認は npm run preview。
公開前に npm run lint、npm run typecheck、npm run check:translations、ビルド後に npm run check:i18n-source、npm run check:translated-html、npm run check:links を実行します。
Edgeでの表示確認はプレビュー起動中に npm run check:browser。生成されるreviewは公開対象外です。

## GitHub Pages

Settings → PagesのSourceをGitHub Actionsにします。Actions → Build and deploy Pages → Run workflowで手動公開します。
ワークフローはリポジトリ名からプロジェクトサブパスを設定します。配布情報は src/data/site.ts、効果の説明は src/data/effects.ts、辞典の日本語データは src/data/glossary.ts で管理します。辞典は固定ID、カテゴリ、別名、v0.2.4の確認元を持ち、別言語のデータも追加できる構成です。

## 翻訳の保守

ページと説明データは日本語の共通ソースで管理し、`src/i18n/locales/` に各言語の完全な翻訳資源を置きます。ビルド時に静的HTMLの本文、検索別名、件数表示、画像代替文、ナビゲーション、SEO文言を翻訳します。技術識別子、コード、固定IDとライセンス原文は保持します。

日本語の文言を変更したら `npm run extract:i18n` で `src/i18n/source.json` と非公開の `review/translation-context.json` を更新し、新しいキーを全4言語に翻訳してください。その後 `npm run check:translations` と通常の45ページビルド・表示検証を実行します。欠落キー・空の訳・日本語の代替文を検査し、未翻訳のまま公開しません。アプリのUI表記は公開版の `language/{ja,en,zh-Hant,zh-Hans,ko}.json` に照合します。

表示検証はユーザーPCにインストールされたMicrosoft Edgeを、独立した一時プロファイルのヘッドレスモードで利用します。`PREVIEW_URL` で対象URLを指定できます。

## 掲載画像

掲載モデルの本体・テクスチャ・モーションは含みません。撮影画像の権利とソースの権利は別です。[CREDITS.md](CREDITS.md)を参照してください。
