// utils/cn.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn merges conditional classes and resolves Tailwind conflicts
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
