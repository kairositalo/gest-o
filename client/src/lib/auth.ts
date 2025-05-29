import { apiRequest } from "./queryClient";
import type { LoginData } from "@shared/schema";

export async function loginUser(credentials: LoginData) {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
}

export async function logoutUser() {
  const response = await apiRequest("POST", "/api/auth/logout");
  return response.json();
}

export async function getCurrentUser() {
  const response = await apiRequest("GET", "/api/auth/me");
  return response.json();
}

export function isValidCorporateEmail(email: string): boolean {
  // Basic corporate email validation
  const personalEmailDomains = [
    'gmail.com',
    'hotmail.com',
    'yahoo.com',
    'outlook.com',
    'live.com',
    'icloud.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain && !personalEmailDomains.includes(domain);
}

export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function canManageUsers(userRole: string): boolean {
  return hasPermission(userRole, ['administrador', 'gestor']);
}

export function canCreateProjects(userRole: string): boolean {
  return hasPermission(userRole, ['administrador', 'gestor']);
}

export function canReviewFiles(userRole: string): boolean {
  return hasPermission(userRole, ['administrador', 'gestor', 'gestor_final']);
}
