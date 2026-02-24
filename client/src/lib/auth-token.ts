let authToken: string | null = sessionStorage.getItem("authToken");

export function setAuthToken(token: string) {
  authToken = token;
  sessionStorage.setItem("authToken", token);
}

export function getAuthToken(): string | null {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  sessionStorage.removeItem("authToken");
}
