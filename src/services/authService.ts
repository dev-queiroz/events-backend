import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import * as bcrypt from "bcrypt";
import { env } from "../config/env";
import { User } from "../models/user";
import { DynamoDBGetItemResponse } from "../types/dynamodb";
import { generateToken, getAuthenticatedUser } from "../utils/jwtUtils";
import { getCurrentISOString } from "../utils/dateUtils";

const client = new DynamoDBClient({ region: env.AWS_REGION });

// Registro de um novo usuário
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
    password,
    role: role as "organizer" | "customer",
    name,
    phone,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await client.send(
    new PutItemCommand({
      TableName: env.DYNAMODB_TABLE_USERS,
      Item: marshall({ ...user, password_hash: passwordHash }),
      ConditionExpression: "attribute_not_exists(email)", // Evita duplicatas
    })
  );

  const token = generateToken(user);
  return { user, token };
};

// Login de um usuário
export const login = async (
  email: string,
  password: string
): Promise<{ user: User; token: string }> => {
  const response: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_USERS,
      Key: marshall({ email }),
    })
  );

  if (!response.Item) throw new Error("User not found");
  const userData = unmarshall(response.Item) as User & {
    password_hash: string;
  };

  const isValid = await bcrypt.compare(password, userData.password_hash);
  if (!isValid) throw new Error("Invalid password");

  const user: User = {
    id: userData.id,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    name: userData.name,
    phone: userData.phone,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  };

  const token = generateToken(user);
  return { user, token };
};

// Solicitação de recuperação de senha (simulação)
export const forgotPassword = async (email: string): Promise<void> => {
  const response: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_USERS,
      Key: marshall({ email }),
    })
  );

  if (!response.Item) throw new Error("User not found");
  // TODO: Integrar com Amazon SNS para envio de email em produção
  console.log(`Reset password requested for ${email}`);
};

// Redefinição de senha
export const resetPassword = async (
  email: string,
  newPassword: string
): Promise<void> => {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_USERS,
      Key: marshall({ email }),
      UpdateExpression: "SET password_hash = :ph, updated_at = :ua",
      ExpressionAttributeValues: marshall({
        ":ph": passwordHash,
        ":ua": getCurrentISOString(),
      }),
    })
  );
};

// Validação de token (usado em Lambda para autenticação)
export const validateToken = async (token: string): Promise<User> => {
  const { id, email, role } = getAuthenticatedUser(token);

  const response: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_USERS,
      Key: marshall({ email }),
    })
  );

  if (!response.Item) throw new Error("User not found");
  const user = unmarshall(response.Item) as User;
  if (user.id !== id || user.role !== role)
    throw new Error("Invalid token data");

  return user;
};
