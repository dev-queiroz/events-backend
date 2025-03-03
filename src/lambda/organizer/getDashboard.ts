import { APIGatewayProxyEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { getEvents } from "../../services/eventService";
import { getReservationsByCustomer } from "../../services/reservationService";
import {
  AuthenticatedAPIGatewayProxyEvent,
  LambdaResponse,
} from "../../types/lambda";
import { JwtPayload } from "../../types/auth";
import { Event } from "../../models/event";
import { Reservation } from "../../models/reservation";

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
          message:
            "Permission denied: only organizers can access the dashboard",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Obter eventos do organizador
    const allEvents = await getEvents();
    const organizerEvents: Event[] = allEvents.filter(
      (event) => event.organizer_id === authEvent.user!.id
    );

    // Obter reservas relacionadas aos eventos do organizador
    const eventIds = organizerEvents.map((event) => event.id);
    const reservations: Reservation[] = [];
    for (const eventId of eventIds) {
      const eventReservations = await getReservationsByEvent(eventId);
      reservations.push(...eventReservations);
    }

    // Calcular estatísticas
    const totalSales = reservations.reduce(
      (sum, reservation) => sum + reservation.total_price,
      0
    );
    const totalReservations = reservations.length;
    const recentReservations = reservations.slice(0, 5);

    const dashboardData = {
      totalSales,
      totalReservations,
      events: organizerEvents,
      recentReservations,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(dashboardData),
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
            : "Failed to fetch dashboard data",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

// Função auxiliar para buscar reservas por evento
async function getReservationsByEvent(eventId: string): Promise<Reservation[]> {
  const { DynamoDBClient, QueryCommand } = await import(
    "@aws-sdk/client-dynamodb"
  );
  const { marshall, unmarshall } = await import("@aws-sdk/util-dynamodb");
  const client = new DynamoDBClient({ region: env.AWS_REGION });

  const response = await client.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      IndexName: "EventIdIndex",
      KeyConditionExpression: "event_id = :eid",
      ExpressionAttributeValues: marshall({ ":eid": eventId }),
    })
  );

  return response.Items
    ? response.Items.map((item) => unmarshall(item) as Reservation)
    : [];
}
