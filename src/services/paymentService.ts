import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { env } from "../config/env";
import { Payment } from "../models/payment";
import {
  DynamoDBGetItemResponse,
  DynamoDBUpdateItemResponse,
} from "../types/dynamodb";
import { confirmReservation } from "./reservationService";
import { getCurrentISOString } from "../utils/dateUtils";

const client = new DynamoDBClient({ region: env.AWS_REGION });

// Criar um novo pagamento
export const createPayment = async (
  reservationId: string,
  amount: number,
  paymentMethod: string
): Promise<Payment> => {
  const payment: Payment = {
    id: crypto.randomUUID(),
    reservation_id: reservationId,
    amount,
    payment_method: paymentMethod,
    status: "pending",
    transaction_id: undefined,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await client.send(
    new PutItemCommand({
      TableName: env.DYNAMODB_TABLE_PAYMENTS,
      Item: marshall(payment),
    })
  );

  return payment;
};

// Processar pagamento (simulação de webhook)
export const processPayment = async (
  paymentId: string,
  transactionId: string
): Promise<Payment> => {
  const paymentResponse: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_PAYMENTS,
      Key: marshall({ id: paymentId }),
    })
  );

  if (!paymentResponse.Item) throw new Error("Payment not found");
  const payment = unmarshall(paymentResponse.Item) as Payment;

  const response: DynamoDBUpdateItemResponse = await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_PAYMENTS,
      Key: marshall({ id: paymentId }),
      UpdateExpression: "SET #s = :s, #tid = :tid, #ua = :ua",
      ExpressionAttributeNames: {
        "#s": "status",
        "#tid": "transaction_id",
        "#ua": "updated_at",
      },
      ExpressionAttributeValues: marshall({
        ":s": "completed",
        ":tid": transactionId,
        ":ua": getCurrentISOString(),
      }),
      ReturnValues: "ALL_NEW",
    })
  );

  await confirmReservation(payment.reservation_id);
  return unmarshall(response.Attributes!) as Payment;
};

// Obter um pagamento por ID
export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const response: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_PAYMENTS,
      Key: marshall({ id: paymentId }),
    })
  );

  if (!response.Item) throw new Error("Payment not found");
  return unmarshall(response.Item) as Payment;
};
