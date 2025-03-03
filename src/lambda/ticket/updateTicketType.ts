import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  updateTicketType,
  getTicketTypesByEvent,
} from "../../services/ticketService";
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
          message: "Permission denied: only organizers can update ticket types",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Validar ID do ticket
    const ticketId = proxyEvent.pathParameters?.id;
    if (!ticketId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing ticket ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Processar corpo da requisição
    const body = JSON.parse(proxyEvent.body || "{}") as Partial<TicketType>;
    const { name, price, quantity_available } = body;

    const updatedTicketType = await updateTicketType(ticketId, {
      name,
      price,
      quantity_available,
    });

    // Verificar se o organizador é o dono do evento associado (opcional, depende da lógica)
    const eventTickets = await getTicketTypesByEvent(
      updatedTicketType.event_id
    );
    const event = await getEventById(updatedTicketType.event_id); // Importar getEventById se necessário
    if (event.organizer_id !== authEvent.user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message:
            "Permission denied: you can only update ticket types for your own events",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedTicketType),
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
          error instanceof Error ? error.message : "Ticket type update failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

// Função auxiliar para buscar evento (se não estiver em ticketService.ts)
async function getEventById(eventId: string): Promise<any> {
  const { getEventById } = await import("../../services/eventService");
  return getEventById(eventId);
}
