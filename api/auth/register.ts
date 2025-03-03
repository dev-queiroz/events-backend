import { APIGatewayProxyEvent } from "aws-lambda";
import { register } from "../../services/authService";
import { User } from "../../models/user";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    const body = JSON.parse(event.body || "{}") as Partial<User>;
    const { email, password, name, role, phone } = body;

    if (!email || !password || !name || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: email, password, name, and role are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const result = await register({ email, password, name, role, phone });

    return {
      statusCode: 201,
      body: JSON.stringify({ user: result.user, token: result.token }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : "Registration failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
