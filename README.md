# Chat Widget

A lightweight, embeddable chatbot widget built with React, TypeScript, and Tailwind CSS v4. Renders inside a Shadow DOM web component (`<chat-widget>`) for complete style isolation — no CSS conflicts with the host page.

## Features

- **Shadow DOM isolation** — drop into any page with zero side effects
- **Real-time streaming** — tokens render word-by-word via Server-Sent Events
- **Stop generation** — abort a response mid-stream
- **Employee auth** — reads `localStorage.employeeNumber` and forwards it to your backend
- **Minimal footprint** — React, Lucide icons, nothing else

---

## Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) (to clone the repo)

---

## Getting Started

### Step 1 — Clone the repository

```bash
git clone https://github.com/MaitraAmbalia/chatbot_widget.git
cd chatbot_widget
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure the backend URL

Open `src/App.tsx` and set the `CHAT_API_URL` variable to point to your backend server:

```ts
const CHAT_API_URL = "https://your-backend-url.com/chat";
```

### Step 4 — (Optional) Set up a dev proxy

If your backend runs locally (e.g. on port 3000), add a proxy block to `vite.config.ts` to avoid CORS issues during development:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/chat': 'http://localhost:3000' }
  }
})
```

### Step 5 — Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

> **Note:** You need a running backend that implements the [SSE contract](#backend-protocol) for the chat to work end-to-end.

---

## Production Build

Follow these steps to create a production-ready bundle:

### Step 1 — Run the build command

```bash
npm run build
```

This runs the TypeScript compiler (`tsc -b`) followed by the Vite bundler.

### Step 2 — Verify the output

The build output is written to the `dist/` directory:

```
dist/
├── assets/
│   ├── index-XXXXX.js    ← bundled JavaScript
│   └── index-XXXXX.css   ← bundled styles
└── index.html
```

### Step 3 — Preview the production build locally (optional)

```bash
npm run preview
```

This starts a local static server serving the `dist/` folder so you can verify everything works before deploying.

### Step 4 — Deploy

Upload the contents of `dist/` to any static hosting provider (Vercel, Netlify, GitHub Pages, S3, etc.).

---

## Embedding the Widget

To embed the chat widget into an existing website:

### Step 1 — Copy the build output

Copy the `dist/` directory (or its contents) into your project's public/static folder.

### Step 2 — Add the custom element and script to your HTML

```html
<!-- Place the widget on the page -->
<chat-widget style="position: fixed; bottom: 24px; right: 24px; z-index: 9999;"></chat-widget>

<!-- Load the widget bundle -->
<script type="module" src="/dist/assets/index.js"></script>
```

The widget registers itself as a Custom Element and renders inside its own Shadow DOM — no styles will leak in or out.

---

## Backend Protocol

The widget sends a `POST` to the configured endpoint and expects an SSE stream back.

**Request**

```
POST /chat
Content-Type: application/json

{ "employeeNumber": "12345", "message": "How do I reset my password?" }
```

**Response**

```
Content-Type: text/event-stream

data: Hello
data: , how can
data:  I help?
```

Each token is a `data: <text>\n\n` line. Close the connection when the stream is complete. Return `401` / `403` to trigger an authorization error in the UI.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Type-check with TypeScript, then bundle for production |
| `npm run preview` | Serve the production build locally for testing |
| `npm run lint` | Lint the codebase with ESLint |

---

## Configuration

| Setting | Where |
|---|---|
| Backend URL | `CHAT_API_URL` in `src/App.tsx` |
| Dev proxy | `server.proxy` in `vite.config.ts` |
| Auth key | `localStorage.getItem('employeeNumber')` in `App.tsx` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Icons | Lucide React |
| Build | Vite 8 |
| Isolation | Shadow DOM + Custom Elements |

---

## Project Structure

```
├── index.html          Host page with <chat-widget>
├── src/
│   ├── main.tsx        Web Component registration (Shadow DOM)
│   ├── App.tsx         Chat UI + streaming logic
│   └── index.css       Tailwind entry point
├── vite.config.ts      Vite + Tailwind config
└── package.json
```

---

## License

MIT
