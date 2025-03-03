import { APIGatewayProxyEvent } from "aws-lambda";
import { login } from "../../services/authService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required fields: email and password are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const result = await login(email, password);

    return {
      statusCode: 200,
      body: JSON.stringify({ user: result.user, token: result.token }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Login failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
