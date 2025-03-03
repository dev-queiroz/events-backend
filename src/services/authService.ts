import * as bcrypt from "bcrypt";
import { env } from "../config/env";
import * as jwt from "jsonwebtoken";
import { User, UserModel } from "../models/user";
import { JwtPayload } from "../types/auth";
import { generateToken } from "../utils/jwtUtils";
import { getCurrentISOString } from "../utils/dateUtils";

export const register = async (
  userData: Partial<User>
): Promise<{ user: User; token: string }> => {
  const { email, password, name, role, phone } = userData;
  if (!email || !password || !name || !role)
    throw new Error("Missing required fields");

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const user: User = {
    id,
    email,
    password: passwordHash,
    role: role as "organizer" | "customer",
    name,
    phone,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await UserModel.create({ ...user, password_hash: passwordHash });

  const token = generateToken(user);
  return { user, token };
};

export const login = async (
  email: string,
  password: string
): Promise<{ user: User; token: string }> => {
  const userData = await UserModel.findOne({ email }).exec();
  if (!userData) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, userData.password_hash);
  if (!isValid) throw new Error("Invalid password");

  const user: User = {
    id: userData.id,
    email: userData.email,
    password: userData.password_hash,
    role: userData.role as "organizer" | "customer",
    name: userData.name,
    phone: userData.phone ?? undefined,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  };

  const token = generateToken(user);
  return { user, token };
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await UserModel.findOne({ email }).exec();
  if (!user) throw new Error("User not found");
  // Simulação: em produção, enviar email via serviço externo
  console.log(`Reset password requested for ${email}`);
};

export const resetPassword = async (
  email: string,
  newPassword: string
): Promise<void> => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const result = await UserModel.updateOne(
    { email },
    { password_hash: passwordHash, updated_at: getCurrentISOString() }
  ).exec();
  if (result.modifiedCount === 0) throw new Error("User not found");
};

export const validateToken = async (token: string): Promise<User> => {
  const { id, email, role } = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  const userData = await UserModel.findOne({ email }).exec();
  if (!userData || userData.id !== id || userData.role !== role)
    throw new Error("Invalid token");

  return {
    id: userData.id,
    email: userData.email,
    password: userData.password_hash,
    role: userData.role as "organizer" | "customer",
    name: userData.name,
    phone: userData.phone ?? undefined,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  };
};
