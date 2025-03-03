import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getPaymentById } from "../../services/paymentService";
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
          message: "Permission denied: only customers can view payments",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Validar ID do pagamento
    const paymentId = proxyEvent.pathParameters?.id;
    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing payment ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const payment = await getPaymentById(paymentId);

    // Verificar se o cliente é o dono do pagamento (via reserva)
    const reservation = await getReservationById(payment.reservation_id);
    if (reservation.customer_id !== authEvent.user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Permission denied: you can only view your own payments",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(payment),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes("Permission denied")
        ? 403
        : 404;
    return {
      statusCode,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Payment not found",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

// Função auxiliar para buscar reserva
async function getReservationById(reservationId: string): Promise<any> {
  const { getReservationById } = await import(
    "../../services/reservationService"
  );
  return getReservationById(reservationId);
}
