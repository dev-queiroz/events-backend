import { APIGatewayProxyEvent } from "aws-lambda";
import { getEventById } from "../../services/eventService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  proxyEvent: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const eventId = proxyEvent.pathParameters?.id;
    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing event ID" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const eventData = await getEventById(eventId);

    return {
      statusCode: 200,
      body: JSON.stringify(eventData),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Event not found",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
