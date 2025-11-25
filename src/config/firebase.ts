/**
 * Firebase initialization
 *
 * This module initializes and exports the Firebase `app` and `auth`
 * instances. It uses the Firebase configuration from the project.
 */
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Configuración de Firebase
// Usa las variables de entorno si están disponibles, sino usa la configuración directa
const getFirebaseConfig = () => {
  // Primero intenta usar variables de entorno (recomendado para producción)
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  // Si las variables de entorno están configuradas, úsalas
  if (apiKey && authDomain && projectId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId,
      appId,
      measurementId,
    };
  }

  // Si no, usa la configuración directa del proyecto
  return {
    apiKey: "AIzaSyA78jwHU5oujBwsn8pVnd89JI6yHGtvWms",
    authDomain: "proyecto3pi.firebaseapp.com",
    projectId: "proyecto3pi",
    storageBucket: "proyecto3pi.firebasestorage.app",
    messagingSenderId: "98785807246",
    appId: "1:98785807246:web:bffcddd0024dfdaff772df",
    measurementId: "G-WMBZ8VF906"
  };
};

// Inicializar Firebase solo si no está ya inicializado
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;
let githubProvider: GithubAuthProvider;

try {
  const firebaseConfig = getFirebaseConfig();
  // Initialize the Firebase app instance and authentication client.
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();
  
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  throw new Error('Firebase no pudo ser inicializado. Por favor, verifica tu configuración.');
}

export { auth, googleProvider, githubProvider };
export default app;

