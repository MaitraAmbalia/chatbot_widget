# Chat Widget

A lightweight, embeddable chatbot widget built with React, TypeScript, and Tailwind CSS v4. Renders inside a Shadow DOM web component (`<chat-widget>`) for complete style isolation — no CSS conflicts with the host page.

## Features

- **Shadow DOM isolation** — drop into any page with zero side effects
- **Real-time streaming** — tokens render word-by-word via Server-Sent Events
- **Stop generation** — abort a response mid-stream
- **Employee auth** — reads `localStorage.employeeNumber` and forwards it to your backend
- **Minimal footprint** — React, Lucide icons, nothing else

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. You'll need a running backend that implements the [SSE contract](#backend-protocol) for the chat to work.

> **Dev proxy** — add a proxy block in `vite.config.ts` to avoid CORS issues during development:
>
> ```ts
> export default defineConfig({
>   plugins: [react(), tailwindcss()],
>   server: {
>     proxy: { '/chat': 'http://localhost:3000' }
>   }
> })
> ```

## Production Build

```bash
npm run build
```

Outputs a bundle to `dist/`. Serve with any static host.

## Embedding

Copy the `dist/` output into your project and add two lines to your HTML:

```html
<chat-widget style="position: fixed; bottom: 24px; right: 24px; z-index: 9999;"></chat-widget>
<script type="module" src="/dist/assets/index.js"></script>
```

The widget registers itself as a Custom Element and renders inside its own Shadow DOM.

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

## Configuration

| Setting | Where |
|---|---|
| Backend URL | `CHAT_API_URL` in `src/App.tsx` |
| Dev proxy | `server.proxy` in `vite.config.ts` |
| Auth key | `localStorage.getItem('employeeNumber')` in `App.tsx` |

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Icons | Lucide React |
| Build | Vite 8 |
| Isolation | Shadow DOM + Custom Elements |

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

## License

MIT
