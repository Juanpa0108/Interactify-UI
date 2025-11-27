import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../config/firebase";

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
 */
const RequireAuth: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const current = auth.currentUser;
    if (current) {
      setAuthenticated(true);
      setChecking(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthenticated(!!user);
      setChecking(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (checking) {
    return <div style={{ padding: 20 }}>Checking session...</div>;
  }

  return authenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default RequireAuth;
