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
    if (!this.shadowRoot || this.shadowRoot.childNodes.length > 0) return;

    if (!document.head.querySelector('link[data-chat-widget-styles]')) {
      const globalLink = document.createElement('link');
      globalLink.rel = 'stylesheet';
      globalLink.href = cssUrl;
      globalLink.dataset.chatWidgetStyles = 'true';
      document.head.appendChild(globalLink);
    }

    const shadowLink = document.createElement('link');
    shadowLink.rel = 'stylesheet';
    shadowLink.href = cssUrl;
    this.shadowRoot.appendChild(shadowLink);

    const mountPoint = document.createElement('div');
    mountPoint.id = 'chat-widget-root';
    this.shadowRoot.appendChild(mountPoint);

    createRoot(mountPoint).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

customElements.define('chat-widget', ChatWidgetElement);
