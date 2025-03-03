import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createTicketType } from "../../services/ticketService";
import { TicketType } from "../../models/ticketType";
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

    if (authEvent.user.role !== "organizer") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: only organizers can create ticket types",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Processar corpo da requisição
    const body = JSON.parse(proxyEvent.body || "{}") as Partial<TicketType>;
    const { event_id, name, price, quantity_available } = body;

    if (
      !event_id ||
      !name ||
      price === undefined ||
      quantity_available === undefined
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: event_id, name, price, and quantity_available are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const ticketType = await createTicketType({
      event_id,
      name,
      price,
      quantity_available,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(ticketType),
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
            : "Ticket type creation failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
