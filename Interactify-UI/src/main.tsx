// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/_globals.scss';
import './styles/_layout.scss';
import ErrorBoundary from './ErrorBoundary';

/**
 * Entry point for the React application.
 *
 * Responsibilities:
 * - Find the DOM root element (`#root`) and mount the React tree into it.
 * - Install lightweight global error handlers to show readable messages
 *   on the page in case the app fails before React can render.
 * - Wrap the app in an `ErrorBoundary` so rendering errors are captured
 *   and displayed in a friendly way instead of leaving a blank page.
 */
const rootEl = document.getElementById('root');

if (!rootEl) {
  // If the `#root` element is missing, render a clear error message
  // directly into the page so the developer sees what went wrong.
  // eslint-disable-next-line no-console
  console.error('Missing `#root` element in index.html');
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui;color:#b00020">Missing <strong>#root</strong> element in HTML. Ensure `index.html` contains <code>&lt;div id="root"&gt;&lt;/div&gt;</code>.</div>';
} else {
  // Attach simple global handlers that will display a visible message
  // on the page if an uncaught error or unhandled rejection happens.
  // This helps debugging in development when the console might be missed.
  window.addEventListener('error', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Global error captured:', ev.error || ev.message || ev);
    try {
      const el = document.getElementById('root');
      if (el)
        el.innerHTML = `<div style="padding:24px;font-family:system-ui;color:#b00020">Runtime error: ${String(
          ev.error?.message || ev.message || ev.error || ev,
        )}<br/>Check the developer console for details.</div>`;
    } catch (e) {
      // ignore secondary errors
    }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', ev.reason);
    try {
      const el = document.getElementById('root');
      if (el)
        el.innerHTML = `<div style="padding:24px;font-family:system-ui;color:#b00020">Unhandled rejection: ${String(
          ev.reason?.message || ev.reason || ev,
        )}<br/>Check the developer console for details.</div>`;
    } catch (e) {
      // ignore secondary errors
    }
  });

  // Mount the React application rooted at `#root`.
  ReactDOM.createRoot(rootEl as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
