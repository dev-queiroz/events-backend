// Payload do JWT
export interface JwtPayload {
  id: string;
  email: string;
  role: "organizer" | "customer";
  iat?: number; // Issued at (opcional)
  exp?: number; // Expiration (opcional)
}

// Usuário autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "organizer" | "customer";
}
