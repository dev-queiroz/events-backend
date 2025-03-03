import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createEvent } from "../../services/eventService";
import { Event } from "../../models/event";
import {
  AuthenticatedAPIGatewayProxyEvent,
  LambdaResponse,
} from "../../types/lambda";
import { JwtPayload } from "../../types/auth";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    // Validar token JWT
    const token = event.headers.Authorization?.split(" ")[1];
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "No token provided" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const authEvent = event as AuthenticatedAPIGatewayProxyEvent;
    authEvent.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    if (authEvent.user.role !== "organizer") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: only organizers can create events",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Processar corpo da requisição
    const body = JSON.parse(event.body || "{}") as Partial<Event> & {
      image?: string;
    };
    const { image, ...eventData } = body;

    const newEvent = await createEvent(
      eventData,
      authEvent.user.id,
      image ? Buffer.from(image, "base64") : undefined
    );

    return {
      statusCode: 201,
      body: JSON.stringify(newEvent),
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
          error instanceof Error ? error.message : "Event creation failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
