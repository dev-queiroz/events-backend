import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createPayment } from "../../services/paymentService";
import { Payment } from "../../models/payment";
import {
  AuthenticatedAPIGatewayProxyEvent,
  LambdaResponse,
} from "../../types/lambda";
import { JwtPayload } from "../../types/auth";

export const handler = async (
  proxyEvent: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    // Validar token JWT
    const token = proxyEvent.headers.Authorization?.split(" ")[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "No token provided" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const authEvent = proxyEvent as AuthenticatedAPIGatewayProxyEvent;
    authEvent.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    if (authEvent.user.role !== "customer") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: only customers can create payments",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Processar corpo da requisição
    const body = JSON.parse(proxyEvent.body || "{}") as Partial<Payment>;
    const { reservation_id, amount, payment_method } = body;

    if (!reservation_id || amount === undefined || !payment_method) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: reservation_id, amount, and payment_method are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const payment = await createPayment(reservation_id, amount, payment_method);

    return {
      statusCode: 201,
      body: JSON.stringify(payment),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes("Permission denied")
        ? 403
        : 400;
    return {
      statusCode,
      body: JSON.stringify({
        message:
          error instanceof Error ? error.message : "Payment creation failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
