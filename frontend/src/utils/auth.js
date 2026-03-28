/**
 * Decode the JWT stored in localStorage and return the user's role.
 *
 * Returns "farmer" | "buyer" | null.
 * Never throws — returns null for any invalid / missing token.
 */

export function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.role || null;
  } catch {
    return null;
  }
}

/**
 * Returns the decoded user object { id, role, iat, exp } or null.
 */

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return isLoggedIn();
}

/**
 * Returns true when a user object exists. Backend validates strictly via cookies.
 */
export function isLoggedIn() {
  return getUser() !== null;
}
 
