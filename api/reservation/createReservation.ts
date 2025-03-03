import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createReservation } from "../../services/reservationService";
import { Reservation } from "../../models/reservation";
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
          message: "Permission denied: only customers can create reservations",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Processar corpo da requisição
    const body = JSON.parse(proxyEvent.body || "{}") as Partial<Reservation>;
    const { event_id, ticket_type_id, quantity } = body;

    if (!event_id || !ticket_type_id || !quantity) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: event_id, ticket_type_id, and quantity are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const reservation = await createReservation(
      { event_id, ticket_type_id, quantity },
      authEvent.user.id
    );

    return {
      statusCode: 201,
      body: JSON.stringify(reservation),
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
          error instanceof Error
            ? error.message
            : "Reservation creation failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
