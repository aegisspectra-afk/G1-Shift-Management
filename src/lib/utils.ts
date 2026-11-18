import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let uidCounter = 0;

export function uid(prefix = "id"): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter.toString(36)}`;
}

export function resetUidCounter() {
  uidCounter = 0;
}