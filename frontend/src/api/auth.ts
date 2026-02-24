// src/api/auth.ts
import { apiClient } from "./client";

export type OtpStartResponse = {
  message: string;
  temp_token: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user?: unknown;
};

// Unified return type for the 2-step flow
export type LoginResponse = OtpStartResponse | TokenResponse;

export type LoginInput = {
  username: string; // email in our app
  password: string;
  turnstileToken?: string;
};

export type VerifyOtpInput = {
  tempToken: string;
  code: string; // 6-digit
};

function isTokenResponse(data: any): data is TokenResponse {
  return typeof data?.access_token === "string" && data.access_token.length > 0;
}

function isOtpStartResponse(data: any): data is OtpStartResponse {
  return typeof data?.temp_token === "string" && data.temp_token.length > 0;
}

function normalizeLoginResponse(data: unknown): LoginResponse {
  const d = data as any;

  // Step 2 response
  if (isTokenResponse(d)) {
    return {
      access_token: d.access_token,
      token_type: d.token_type ?? "bearer",
      user: d?.user ?? d?.data?.user,
    };
  }

  // Step 1 response
  if (isOtpStartResponse(d)) {
    return {
      message: d.message ?? "OTP sent",
      temp_token: d.temp_token,
    };
  }

  throw new Error("Unexpected auth response from server.");
}

/**
 * Step 1: Login using JSON endpoint: POST /api/auth/login/json
 * Returns temp_token (OTP session token).
 */
export async function login({ username, password, turnstileToken }: LoginInput): Promise<OtpStartResponse> {
  const email = username.trim();

  const res = await apiClient.post("/auth/login/json", {
    email,
    password,
    turnstile_token: turnstileToken,
  });

  const normalized = normalizeLoginResponse(res.data);

  if (!("temp_token" in normalized)) {
    throw new Error("Login did not return temp_token. OTP step cannot start.");
  }

  return normalized;
}

/**
 * Step 2: Verify OTP: POST /api/auth/verify-otp
 * Returns final JWT access_token.
 */
export async function verifyOtp(tempToken: string, code: string): Promise<TokenResponse> {
  const res = await apiClient.post("/auth/verify-otp", {
    temp_token: tempToken,
    code,
  });

  const normalized = normalizeLoginResponse(res.data);

  if (!("access_token" in normalized)) {
    throw new Error("OTP verification did not return an access token.");
  }

  return normalized;
}

export const register = async (userData: any) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};
