import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { AuthenticatedUser } from "./auth";

// Evento Lambda estendido com usuário autenticado
export interface AuthenticatedAPIGatewayProxyEvent
  extends APIGatewayProxyEvent {
  user?: AuthenticatedUser;
}

// Resposta padrão do Lambda
export interface LambdaResponse extends APIGatewayProxyResult {
  statusCode: number;
  body: string;
  headers?: { [key: string]: string };
}
