import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getReservationsByCustomer } from "../../services/reservationService";
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
          message:
            "Permission denied: only customers can view their reservations",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const reservations = await getReservationsByCustomer(authEvent.user.id);

    return {
      statusCode: 200,
      body: JSON.stringify(reservations),
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
            : "Failed to fetch reservations",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
