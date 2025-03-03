import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  getReservationById,
  cancelReservation,
} from "../../services/reservationService";
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
          message: "Permission denied: only customers can cancel reservations",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Validar ID da reserva
    const reservationId = proxyEvent.pathParameters?.id;
    if (!reservationId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing reservation ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Verificar se o cliente é o dono da reserva
    const reservation = await getReservationById(reservationId);
    if (reservation.customer_id !== authEvent.user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message:
            "Permission denied: you can only cancel your own reservations",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    await cancelReservation(reservationId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Reservation cancelled successfully" }),
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
            : "Reservation cancellation failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
