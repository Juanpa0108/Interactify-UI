import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../config/firebase';

/**
 * Props accepted by RequireAuth.
 * `children` is the protected element tree that should only render when
 * the user is authenticated.
 */
type Props = {
  children: React.ReactNode;
};

/**
 * RequireAuth
 *
 * This component acts as a route guard. It subscribes to Firebase's
 * `onAuthStateChanged` to determine whether a valid session exists.
 *
 * Behavior:
 * - While authentication state is being checked, it renders a small
 *   "Checking session..." placeholder to avoid flashing protected UI.
 * - If the user is authenticated, it renders `children`.
 * - If the user is not authenticated, it redirects to `/login`.
 *
 * Implementation notes:
 * - We rely only on Firebase's auth state instead of `localStorage` tokens
 *   because localStorage can be stale or forged. Firebase is the source of
 *   truth for session validity.
 */
const RequireAuth: React.FC<Props> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase auth state changes. The callback is invoked once
    // Firebase resolves the current user which allows us to reliably decide
    // if the session is active.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthenticated(!!user);
      setChecking(false);
    });

    // Failsafe: if Firebase does not call back within a short window, stop
    // waiting so the UI doesn't hang indefinitely. This treats the user as
    // unauthenticated after the timeout.
    const timeout = setTimeout(() => {
      if (checking) {
        setChecking(false);
        setAuthenticated(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (checking) {
    // A simple progressive state while the auth SDK determines the user.
    return <div style={{ padding: 20 }}>Checking session...</div>;
  }

  // If authenticated, render the protected children; otherwise redirect.
  // Return `children` directly wrapped in a fragment to preserve the
  // ReactNode type and avoid relying on the global `JSX` namespace.
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default RequireAuth;
