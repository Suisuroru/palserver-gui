# palserver GUI 官網(Next.js 靜態站)

React(Next.js App Router)撰寫、`next build` 直接匯出純靜態 HTML 到 `out/`,可部署到 Zeabur、Vercel、Netlify、GitHub Pages 或任何靜態主機。

```
website/
├─ app/
│  ├─ layout.tsx     SEO metadata(title/OG/Twitter/canonical)+ JSON-LD
│  ├─ page.tsx       頁面組裝 + FAQ JSON-LD
│  ├─ globals.css    全站樣式(含 RWD 手機優化、深淺色)
│  ├─ icon.svg       favicon
│  ├─ robots.ts      → /robots.txt
│  └─ sitemap.ts     → /sitemap.xml
├─ components/       各區塊元件(Nav、Hero、Features、Footer…)
├─ public/assets/    截圖與 io software logo
├─ next.config.mjs   output: 'export'(純靜態匯出)
└─ zbpack.json       Zeabur:npm run build → out/
```

## 本機開發

```sh
cd website
npm install
npm run dev        # http://localhost:3000
```

## 建置與預覽

```sh
npm run build      # 產出 out/(純靜態,無需 Node 伺服器)
npm run preview    # 用靜態伺服器預覽 out/
```

## 部署到 Zeabur

1. 到 [Zeabur](https://zeabur.com) → 建立 Project → **Deploy from GitHub** → 選這個 repo。
2. 在該服務的 **Settings → Root Directory** 填 `website`。
3. `zbpack.json` 已指定 `npm run build` + `output_dir: out`,會以**靜態站**方式 serve。
4. 到 **Domains** 綁 `palserver-gui.iosoftware.ai`(SEO canonical 已指向此網域)。

## SEO 清單(已內建)

- 預先渲染的完整 HTML(靜態匯出, 爬蟲無需執行 JS)
- title / meta description / keywords / canonical
- Open Graph + Twitter Card(以 `assets/overview.jpg` 為分享縮圖)
- JSON-LD 結構化資料:SoftwareApplication、Organization、WebSite、FAQPage
- `robots.txt` + `sitemap.xml` 自動產生
- 圖片皆有 `alt` 與寬高(避免 CLS),hero 圖 preload、其餘 lazy load
- `lang="zh-Hant"`、`theme-color` 深淺色、RWD 手機優化

## 更新內容

- 文案/區塊:改 `components/` 下對應元件。
- SEO 文字:改 `app/layout.tsx` 開頭的 `TITLE` / `DESCRIPTION` 常數。
- 截圖:放 `public/assets/`,在元件裡以 `/assets/xxx.jpg` 引用(記得填實際寬高)。

改完 push,Zeabur 會自動重新建置部署。
