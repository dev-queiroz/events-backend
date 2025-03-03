import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getEvents } from "../../services/eventService";
import {
  AuthenticatedAPIGatewayProxyEvent,
  LambdaResponse,
} from "../../types/lambda";
import { JwtPayload } from "../../types/auth";
import { Event } from "../../models/event";

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

    // Após a validação do token, user está garantido
    if (authEvent.user!.role !== "organizer") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: only organizers can view their events",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Obter eventos do organizador
    const allEvents = await getEvents();
    const organizerEvents: Event[] = allEvents.filter(
      (event) => event.organizer_id === authEvent.user!.id
    );

    return {
      statusCode: 200,
      body: JSON.stringify(organizerEvents),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes("Permission denied")
        ? 403
        : 500;
    return {
      statusCode,
      body: JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch organizer events",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
