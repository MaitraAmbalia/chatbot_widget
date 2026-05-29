import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import cssUrl from './index.css?url'

class ChatWidgetElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.shadowRoot) return;

    if (this.shadowRoot.childNodes.length > 0) return;

    // Inject into document <head> so Tailwind v4 @property variables are
    // available globally. Guard against mounting the widget more than once.
    if (!document.head.querySelector(`link[data-chat-widget-styles]`)) {
      const globalLink = document.createElement('link');
      globalLink.rel = 'stylesheet';
      globalLink.href = cssUrl;
      globalLink.dataset.chatWidgetStyles = 'true';
      document.head.appendChild(globalLink);
    }

    // Inject the same URL into the shadow root for Tailwind utility classes.
    // Browser serves this from cache — only ONE real network request is made.
    const shadowLink = document.createElement('link');
    shadowLink.rel = 'stylesheet';
    shadowLink.href = cssUrl;
    this.shadowRoot.appendChild(shadowLink);

    const mountPoint = document.createElement('div');
    mountPoint.id = 'chat-widget-root';
    this.shadowRoot.appendChild(mountPoint);

    const root = createRoot(mountPoint);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

customElements.define('chat-widget', ChatWidgetElement);

