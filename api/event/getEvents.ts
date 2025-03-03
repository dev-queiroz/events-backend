import { APIGatewayProxyEvent } from "aws-lambda";
import { getEvents } from "../../services/eventService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const events = await getEvents();

    return {
      statusCode: 200,
      body: JSON.stringify(events),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message:
          error instanceof Error ? error.message : "Failed to fetch events",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
