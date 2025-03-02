export interface User {
  id: string; // UUID como chave primária
  email: string; // Usado como chave secundária para login
  password: string; // Hash da senha
  role: "organizer" | "customer"; // Papel do usuário
  name: string; // Nome completo
  phone?: string; // Telefone (opcional)
  created_at: string; // ISO string (ex.: "2023-10-01T12:00:00Z")
  updated_at: string; // ISO string
}
