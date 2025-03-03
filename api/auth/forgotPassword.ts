import { APIGatewayProxyEvent } from "aws-lambda";
import { forgotPassword } from "../../services/authService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required field: email is required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    await forgotPassword(email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Password reset email sent (simulated)",
      }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          error instanceof Error
            ? error.message
            : "Failed to request password reset",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
