import * as jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload, AuthenticatedUser } from "../types/auth";

// Gera um token JWT
export const generateToken = (user: AuthenticatedUser): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
};

// Valida e decodifica um token JWT
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new Error("Invalid token payload");
    }
    return decoded;
  } catch (error) {
    throw new Error(
      `Token verification failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Extrai o usuário autenticado do token
export const getAuthenticatedUser = (token: string): AuthenticatedUser => {
  const payload = verifyToken(token);
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };
};
