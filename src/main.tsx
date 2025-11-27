// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/_globals.scss';
import './styles/_layout.scss';
import ErrorBoundary from './ErrorBoundary';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './config/firebase';


// If the app was invoked as the result of an OAuth redirect (signInWithRedirect),
// process the redirect result and, if a user was returned, call the backend
// to complete server-side verification and persist the token in localStorage.
// This runs once during startup and does not block rendering.
;(async () => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      try {
        const idToken = await result.user.getIdToken();
        // Try to guess provider path (google/github) from credential if available
        // Try several places for the provider id: some SDK results include it
        // on the top-level result, others include it on `credential`, and the
        // most reliable is the user's providerData array populated by Firebase.
        const providerId =
          (result as any)?.providerId ||
          (result as any)?.credential?.providerId ||
          (result as any)?.user?.providerData?.[0]?.providerId ||
          '';

        let path = '/api/auth/login';
        if (/google/i.test(providerId) || /google\.com/i.test(providerId)) path = '/api/auth/login/google';
        else if (/github/i.test(providerId) || /github\.com/i.test(providerId)) path = '/api/auth/login/github';

        const resp = await fetch(`${API_URL}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (resp.ok) {
          const data = await resp.json();
          localStorage.setItem('token', idToken);
          localStorage.setItem('authToken', idToken);
          localStorage.setItem('user', JSON.stringify(data.user || result.user));
          // Ensure the app navigates to the intended route after redirect login.
          // We store the intended path in `sessionStorage.postAuthRedirect` before
          // starting a redirect-based OAuth flow so we can restore it here.
          try {
            const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/';
            window.history.replaceState({}, '', redirectTo);
            sessionStorage.removeItem('postAuthRedirect');
          } catch (e) {}
        } else {
          console.warn('[getRedirectResult] backend login failed', await resp.text());
        }
      } catch (e) {
        console.error('Error processing redirect sign-in result:', e);
      }
    }
  } catch (e) {
    // No redirect result or error - ignore silently
  }
})();

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
