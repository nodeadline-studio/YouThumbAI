// Simple utility to generate a unique ID
export const nanoid = (): string => {
  return Math.random().toString(36).substring(2, 15);
};