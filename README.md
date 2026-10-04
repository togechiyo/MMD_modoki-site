# MMD_modoki ユーザーサイト

MMD_modokiのダウンロードと日本語の使い方ガイドです。本体とは独立したAstroの静的サイトです。

- 公開サイト：https://togechiyo.github.io/MMD_modoki-site/
- アプリ本体：https://github.com/togechiyo/MMD_modoki
- トップ、ダウンロード、入門、操作マニュアル、FAQ、制作手順、エフェクト、形式の全8ページ。

## 開発と検証

Node.js 24で npm ci を実行し、npm run dev で起動します。
ビルドは npm run build、確認は npm run preview。
公開前に npm run lint、npm run typecheck、npm run check:links を実行します。
Edgeでの表示確認はプレビュー起動中に npm run check:browser。生成されるreviewは公開対象外です。

## GitHub Pages

Settings → PagesのSourceをGitHub Actionsにします。Actions → Build and deploy Pages → Run workflowで手動公開します。
ワークフローはリポジトリ名からプロジェクトサブパスを設定します。配布情報は src/data/site.ts、効果の説明は src/data/effects.ts で管理します。

## 掲載画像

掲載モデルの本体・テクスチャ・モーションは含みません。撮影画像の権利とソースの権利は別です。[CREDITS.md](CREDITS.md)を参照してください。
