import { APIGatewayProxyEvent } from "aws-lambda";
import { getTicketTypesByEvent } from "../../services/ticketService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  proxyEvent: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const eventId = proxyEvent.pathParameters?.eventId;
    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing event ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const ticketTypes = await getTicketTypesByEvent(eventId);

    return {
      statusCode: 200,
      body: JSON.stringify(ticketTypes),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch ticket types",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
