export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

export const toISOString = (date?: Date | string): string => {
  if (!date) return getCurrentISOString();
  return typeof date === "string" ? date : date.toISOString();
};

export const isFutureDate = (date: string): boolean => {
  return new Date(date) > new Date();
};
