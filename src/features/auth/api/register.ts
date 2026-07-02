// Feature: Auth - Registration API

import type { RegisterFormData, AuthResponse } from "../model/types";

export async function registerUser(data: RegisterFormData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      name: data.name, 
      email: data.email, 
      password: data.password 
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: result.error || "Registration failed"
    };
  }

  return { success: true };
}
