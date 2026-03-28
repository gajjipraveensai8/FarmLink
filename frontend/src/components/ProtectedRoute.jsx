import { Navigate } from "react-router-dom";

/**
 * Wraps a route element.
 * If no JWT token is found in localStorage the user is
 * redirected to /login.  Otherwise the children render normally.
 */
export default function ProtectedRoute({ children }) {
  let token = null;
  try {
    token = localStorage.getItem("token");
  } catch (e) {
    token = null;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
