import { Navigate } from "react-router-dom";

/**
 * Wraps a route element.
 * Checks for the "user" object in localStorage (saved by AuthContext on login).
 * Redirects to /login if not found.
 */
export default function ProtectedRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
