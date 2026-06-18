import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const authClient = axios.create({ baseURL: API_BASE });

let accessTokenMemory: string | null = null;

export type AuthResponse = {
  ok: boolean;
  message: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: unknown;
    workspace?: unknown;
  };
};

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function saveTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) {
    accessTokenMemory = accessToken;
    if (canUseStorage()) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken && canUseStorage()) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export const saveToken = (token: string) => saveTokens(token);

export function clearTokens() {
  accessTokenMemory = null;
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const clearToken = clearTokens;

export function getAccessToken() {
  if (accessTokenMemory) return accessTokenMemory;
  if (!canUseStorage()) return null;
  accessTokenMemory = localStorage.getItem(ACCESS_TOKEN_KEY);
  return accessTokenMemory;
}

export function getRefreshToken() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export const getToken = getAccessToken;

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(window.atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getWorkspaceIdFromToken() {
  const token = getAccessToken();
  if (!token || typeof window === 'undefined') return null;
  const payload = decodeJwtPayload(token);
  return payload?.workspaceId ? String(payload.workspaceId) : null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  if (typeof window === 'undefined') return '';
  return window.atob(normalized);
}

export function isAccessTokenExpired(token: string, skewSeconds = 30) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    if (!decoded.exp) return true;
    return decoded.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

export async function login(email: string, password: string) {
  const res = await authClient.post<AuthResponse>('/api/auth/login', { email, password });
  saveTokens(res.data?.data?.accessToken, res.data?.data?.refreshToken);
  return res.data;
}

export async function signup(name: string, email: string, password: string, workspaceName?: string) {
  const res = await authClient.post<AuthResponse>('/api/auth/signup', { name, email, password, workspaceName });
  saveTokens(res.data?.data?.accessToken, res.data?.data?.refreshToken);
  return res.data;
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await authClient.post<AuthResponse>('/api/auth/refresh', { refreshToken });
  const accessToken = res.data?.data?.accessToken;
  const rotatedRefreshToken = res.data?.data?.refreshToken;
  if (!accessToken || !rotatedRefreshToken) throw new Error('Refresh response missing tokens');

  saveTokens(accessToken, rotatedRefreshToken);
  return accessToken;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await authClient.post('/api/auth/logout', { refreshToken });
  } catch {
    // Local logout should still happen if the server token is already expired or revoked.
  } finally {
    clearTokens();
  }
}

export async function inviteWorkspaceMember(email: string, role: 'member' | 'admin') {
  const res = await authClient.post('/api/workspace/invite', { email, role }, {
    headers: { Authorization: `Bearer ${getAccessToken() || ''}` }
  });
  return res.data;
}

export async function joinWorkspace(inviteToken: string) {
  const res = await authClient.post('/api/workspace/join', { inviteToken }, {
    headers: { Authorization: `Bearer ${getAccessToken() || ''}` }
  });
  saveTokens(res.data?.data?.accessToken, res.data?.data?.refreshToken);
  return res.data;
}

export async function ensureAuthenticated() {
  const accessToken = getAccessToken();
  if (accessToken && !isAccessTokenExpired(accessToken)) return true;
  if (!getRefreshToken()) return false;
  try {
    await refreshAccessToken();
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function getValidAccessToken() {
  const accessToken = getAccessToken();
  if (accessToken && !isAccessTokenExpired(accessToken)) return accessToken;
  if (!getRefreshToken()) return null;
  try {
    return await refreshAccessToken();
  } catch {
    clearTokens();
    return null;
  }
}
