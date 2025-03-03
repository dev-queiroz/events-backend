import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getEventById, deleteEvent } from "../../services/eventService";
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
          message: "Permission denied: only organizers can delete events",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Validar ID do evento
    const eventId = proxyEvent.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing event ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Verificar se o organizador é o dono do evento
    const eventData = await getEventById(eventId);
    if (eventData.organizer_id !== authEvent.user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: you can only delete your own events",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    await deleteEvent(eventId);

    return {
      statusCode: 204,
      body: "",
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
          error instanceof Error ? error.message : "Event deletion failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
