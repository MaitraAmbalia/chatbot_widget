# 💬 Chat Widget

A lightweight, embeddable chatbot widget built with **React + TypeScript + Tailwind CSS v4**.  
It renders inside a **Shadow DOM** web component (`<chat-widget>`), so styles never leak into — or out of — the host page.

![preview](https://img.shields.io/badge/status-ready-brightgreen)

---

## Table of Contents

1. [Features](#features)
2. [Quick Start (Development)](#quick-start-development)
3. [Build for Production](#build-for-production)
4. [Embed the Widget in Any Page](#embed-the-widget-in-any-page)
5. [Backend Protocol (SSE Contract)](#backend-protocol-sse-contract)
6. [Backend Examples](#backend-examples)
   - [OpenAI (GPT-4o / GPT-4o-mini)](#openai-gpt-4o--gpt-4o-mini)
   - [Google Gemini](#google-gemini)
   - [Anthropic Claude](#anthropic-claude)
   - [Ollama (Local / Self-Hosted)](#ollama-local--self-hosted)
7. [Frontend Configuration](#frontend-configuration)
8. [Project Structure](#project-structure)

---

## Features

- 🧩 **Shadow DOM isolation** — drop it into any page, zero CSS conflicts
- 🌊 **Real-time streaming** — tokens appear word-by-word via SSE
- ⏹️ **Stop generation** — abort mid-stream with a single click
- 🎨 **Tailwind CSS v4** — modern utility-first styling
- 🔒 **Employee auth** — reads `localStorage.employeeNumber` and sends it to your backend
- ⚡ **Tiny footprint** — no heavy dependencies beyond React & Lucide icons

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev
```

The widget will be available at `http://localhost:5173`.  
You will need a running backend (see [Backend Examples](#backend-examples) below) for the chat to work.

> **Tip:** During development, add a Vite proxy so the widget can reach your backend without CORS issues:
>
> ```ts
> // vite.config.ts
> export default defineConfig({
>   plugins: [react(), tailwindcss()],
>   server: {
>     proxy: {
>       '/chat': 'http://localhost:3000' // your backend address
>     }
>   }
> })
> ```

---

## Build for Production

```bash
npm run build
```

This outputs a production bundle into the `dist/` folder.  
Serve it with any static host (Nginx, Vercel, Netlify, S3, etc).

---

## Embed the Widget in Any Page

After building, copy the `dist/` output to your project and add two lines to your HTML:

```html
<!-- 1. Position the widget wherever you want -->
<chat-widget style="position: fixed; bottom: 24px; right: 24px; z-index: 9999;"></chat-widget>

<!-- 2. Load the widget bundle (adjust path to match your setup) -->
<script type="module" src="/dist/assets/index-XXXXX.js"></script>
```

That's it. The widget registers itself as a Custom Element and renders inside its own Shadow DOM.

---

## Backend Protocol (SSE Contract)

The widget sends a **POST** request and expects a **Server-Sent Events** stream back.  
Your backend must follow this contract:

### Request

```
POST /chat    (or whatever URL you configure in CHAT_API_URL)
Content-Type: application/json

{
  "employeeNumber": "12345",
  "message": "Hello, how do I reset my password?"
}
```

### Response

```
HTTP/1.1 200 OK
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive

data: Hello
data: ,
data:  how
data:  can
data:  I
data:  help
data:  you
data:  today?
```

**Rules:**
- Each chunk is a line starting with `data: ` followed by the token text, then **two** newlines (`\n\n`).
- The widget concatenates all `data:` values to build the full response.
- When the stream is complete, simply end the HTTP response (close the connection).
- Return `401` or `403` to trigger the "Authorization failed" error in the UI.

---

## Backend Examples

Below are complete, copy-paste-ready Express.js backends for each major AI model.  
Create a file called `server.js`, install deps, and run it.

---

### OpenAI (GPT-4o / GPT-4o-mini)

```bash
npm install express cors openai
```

```js
// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',       // change to 'gpt-4o', 'gpt-4', etc.
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) {
        res.write(`data: ${token}\n\n`);
      }
    }
  } catch (err) {
    console.error(err);
    res.write(`data: [Error: ${err.message}]\n\n`);
  }

  res.end();
});

app.listen(3000, () => console.log('OpenAI backend on http://localhost:3000'));
```

```bash
OPENAI_API_KEY=sk-... node server.js
```

---

### Google Gemini

```bash
npm install express cors @google/generative-ai
```

```js
// server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // or 'gemini-2.5-pro'
    const result = await model.generateContentStream(message);

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        res.write(`data: ${token}\n\n`);
      }
    }
  } catch (err) {
    console.error(err);
    res.write(`data: [Error: ${err.message}]\n\n`);
  }

  res.end();
});

app.listen(3000, () => console.log('Gemini backend on http://localhost:3000'));
```

```bash
GEMINI_API_KEY=AIza... node server.js
```

---

### Anthropic Claude

```bash
npm install express cors @anthropic-ai/sdk
```

```js
// server.js
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',   // or 'claude-3-5-haiku-20241022'
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    });

    stream.on('text', (token) => {
      res.write(`data: ${token}\n\n`);
    });

    stream.on('end', () => {
      res.end();
    });

    stream.on('error', (err) => {
      console.error(err);
      res.write(`data: [Error: ${err.message}]\n\n`);
      res.end();
    });
  } catch (err) {
    console.error(err);
    res.write(`data: [Error: ${err.message}]\n\n`);
    res.end();
  }
});

app.listen(3000, () => console.log('Claude backend on http://localhost:3000'));
```

```bash
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

---

### Ollama (Local / Self-Hosted)

No API key needed — runs entirely on your machine.

```bash
npm install express cors
```

```js
// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = 'http://localhost:11434'; // default Ollama address

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',            // or 'mistral', 'codellama', 'phi3', etc.
        prompt: message,
        stream: true,
      }),
    });

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.response) {
            res.write(`data: ${json.response}\n\n`);
          }
        } catch { /* ignore partial JSON */ }
      }
    }
  } catch (err) {
    console.error(err);
    res.write(`data: [Error: ${err.message}]\n\n`);
  }

  res.end();
});

app.listen(3000, () => console.log('Ollama backend on http://localhost:3000'));
```

```bash
# Make sure Ollama is running: ollama serve
# Pull a model first:         ollama pull llama3
node server.js
```

---

## Frontend Configuration

All frontend config lives in a single constant at the top of `src/App.tsx`:

```ts
// src/App.tsx
const CHAT_API_URL = '/chat';
```

| What you want to do | Change |
|---|---|
| Point to a different backend URL | Set `CHAT_API_URL` to `'http://your-server.com/chat'` |
| Add a Vite dev proxy | Add a `server.proxy` block in `vite.config.ts` (see [Quick Start](#quick-start-development)) |
| Change the auth key | Edit the `localStorage.getItem('employeeNumber')` call in `App.tsx` |
| Customize the UI | Edit the Tailwind classes directly in `App.tsx` |

---

## Project Structure

```
chatbot/
├── index.html             # Host page with <chat-widget> custom element
├── src/
│   ├── main.tsx            # Web Component registration (Shadow DOM)
│   ├── App.tsx             # Chat UI + streaming logic
│   └── index.css           # Tailwind CSS entry point
├── vite.config.ts          # Vite + Tailwind plugin config
├── package.json
├── tsconfig.json
└── README.md               # ← You are here
```

---

## License

MIT — use it however you like.
