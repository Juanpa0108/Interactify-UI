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
    // First, check the cached current user synchronously. If a user is
    // already available (cached by Firebase), we can immediately mark the
    // session as authenticated which avoids flicker or unnecessary redirects
    // during fast client-side navigation.
    const current = auth.currentUser;
    if (current) {
      setAuthenticated(true);
      setChecking(false);
      return;
    }

    // Otherwise subscribe to auth state changes. Do NOT force a timeout
    // that treats the user as unauthenticated — transient delays in the
    // auth SDK or network should not cause an immediate redirect.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthenticated(!!user);
      setChecking(false);
    });

    return () => {
      unsubscribe();
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
