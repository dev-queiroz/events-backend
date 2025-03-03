import { APIGatewayProxyEvent } from "aws-lambda";
import { processPayment } from "../../services/paymentService";
import { LambdaResponse } from "../../types/lambda";

export const handler = async (
  proxyEvent: APIGatewayProxyEvent
): Promise<LambdaResponse> => {
  try {
    // Processar corpo da requisição (simulação de webhook)
    const body = JSON.parse(proxyEvent.body || "{}");
    const { paymentId, transactionId } = body;

    if (!paymentId || !transactionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: paymentId and transactionId are required",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const payment = await processPayment(paymentId, transactionId);

    return {
      statusCode: 200,
      body: JSON.stringify(payment),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message:
          error instanceof Error ? error.message : "Payment processing failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
