// Gera uma string ISO atual
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

// Converte uma data para string ISO, se necessário
export const toISOString = (date?: Date | string): string => {
  if (!date) return getCurrentISOString();
  return typeof date === "string" ? date : date.toISOString();
};

// Verifica se uma data está no futuro
export const isFutureDate = (date: string): boolean => {
  return new Date(date) > new Date();
};
