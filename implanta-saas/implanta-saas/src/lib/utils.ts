import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper padrão pra combinar classes Tailwind condicionalmente.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
