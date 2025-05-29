import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "planejamento":
      return "bg-gray-100 text-gray-800";
    case "em_andamento":
      return "bg-blue-100 text-blue-800";
    case "aguardando_revisao":
      return "bg-yellow-100 text-yellow-800";
    case "aprovado":
      return "bg-green-100 text-green-800";
    case "cancelado":
      return "bg-red-100 text-red-800";
    case "pendente":
      return "bg-yellow-100 text-yellow-800";
    case "rejeitado":
      return "bg-red-100 text-red-800";
    case "revisao":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "baixa":
      return "bg-gray-100 text-gray-800";
    case "media":
      return "bg-blue-100 text-blue-800";
    case "alta":
      return "bg-orange-100 text-orange-800";
    case "critica":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "administrador":
      return "bg-red-100 text-red-800";
    case "gestor":
      return "bg-orange-100 text-orange-800";
    case "especialista":
      return "bg-blue-100 text-blue-800";
    case "analista":
      return "bg-green-100 text-green-800";
    case "projetista":
      return "bg-purple-100 text-purple-800";
    case "gestor_final":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function validateCorporateEmail(email: string): boolean {
  const personalDomains = [
    "gmail.com",
    "hotmail.com",
    "yahoo.com",
    "outlook.com",
    "live.com",
    "icloud.com",
  ];
  
  const domain = email.split("@")[1]?.toLowerCase();
  return domain && !personalDomains.includes(domain);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
