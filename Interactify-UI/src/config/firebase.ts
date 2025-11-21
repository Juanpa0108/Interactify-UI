/**
 * Firebase initialization
 *
 * This module initializes and exports the Firebase `app` and `auth`
 * instances. It reads configuration from `import.meta.env` (Vite) so
 * environment variables must be prefixed with `VITE_` (see README).
 *
 * Important:
 * - Type-only imports use `import type` so Vite/ESM won't try to load
 *   these symbols at runtime (they are erased by TypeScript).
 */
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Configuración de Firebase
// TODO: Reemplazar con las credenciales reales de Firebase
const getFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  // Verify that all expected environment values are present. If any are
  // missing, warn the developer and return a minimal demo config so the
  // app can still compile in development. Note: demo config will not
  // provide real Firebase functionality.
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    console.warn('⚠️ Firebase is not fully configured. Some VITE_FIREBASE_* vars are missing.');
    console.warn('Please set the VITE_FIREBASE_* variables in your .env file.');

    return {
      apiKey: apiKey || 'demo-api-key',
      authDomain: authDomain || 'demo.firebaseapp.com',
      projectId: projectId || 'demo-project',
      storageBucket: storageBucket || 'demo-project.appspot.com',
      messagingSenderId: messagingSenderId || '123456789',
      appId: appId || '1:123456789:web:abcdef',
    };
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

// Inicializar Firebase solo si no está ya inicializado
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;
let githubProvider: GithubAuthProvider;

try {
  const firebaseConfig = getFirebaseConfig();
  // Debug: print the resolved Firebase configuration (safe for dev only)
  // This helps verify that Vite `import.meta.env` values are loaded correctly.
  // Avoid logging sensitive values in production.
  // eslint-disable-next-line no-console
  console.debug('Firebase config (client):', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(0, 8) + '...' : undefined,
  });
  // Initialize the Firebase app instance and authentication client.
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();
} catch (error) {
  // If initialization fails, throw an informative error so the developer
  // can fix configuration issues quickly. In production you may want to
  // surface this differently (monitoring, alerts, etc.).
  // eslint-disable-next-line no-console
  console.error('Error initializing Firebase:', error);
  throw new Error('Firebase could not be initialized. Please verify your configuration.');
}

export { auth, googleProvider, githubProvider };
export default app;

