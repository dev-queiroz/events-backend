import { APIGatewayProxyEvent } from "aws-lambda";
import { resetPassword } from "../../services/authService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: email and newPassword are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    await resetPassword(email, newPassword);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Password reset successful" }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          error instanceof Error ? error.message : "Password reset failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
