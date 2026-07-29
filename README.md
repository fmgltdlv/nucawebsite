# NUCA of Las Vegas — demo site

Front-end demo on **Hono + TypeScript** (no Vite, no React). HTML is rendered on the Worker; static CSS/JS live in `public/`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:8787`).

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for live URL, D1/R2, and admin bootstrap.

```bash
npm run deploy
```

## Navigation & copy tracker

Nav labels match [nucalasvegas.com](https://nucalasvegas.com/). Each item shows a status dot:

| Dot | Meaning |
|-----|---------|
| Green | Demo page with sample content |
| Orange | Stub — route exists, copy incomplete |
| Gray | To copy — placeholder with link to live page |

Edit routes and status in `src/nav/site-nav.ts`. Full checklist: **`TODO.md`**.

## Admin (planned)

Secretary admin will include CRUD for **members**, **events**, **leadership**, **posts** (Industry Updates), editable **pages** (Resources, Scholarships, Advocacy, About), and **applications**. Events on the public site will read from D1 after admin is built.


## Stack (planned)

- Cloudflare Workers + D1 + Email Service
- Secretary admin at `/admin` (later)
