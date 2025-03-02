import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { env } from "../config/env";
import { TicketType } from "../models/ticketType";
import {
  DynamoDBScanResponse,
  DynamoDBUpdateItemResponse,
} from "../types/dynamodb";
import { getCurrentISOString } from "../utils/dateUtils";

const client = new DynamoDBClient({ region: env.AWS_REGION });

// Criar um novo tipo de ingresso
export const createTicketType = async (
  ticketData: Partial<TicketType>
): Promise<TicketType> => {
  const ticket: TicketType = {
    id: crypto.randomUUID(),
    event_id: ticketData.event_id || "",
    name: ticketData.name || "",
    price: ticketData.price || 0,
    quantity_available: ticketData.quantity_available || 0,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await client.send(
    new PutItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Item: marshall(ticket),
    })
  );

  return ticket;
};

// Listar tipos de ingressos por evento
export const getTicketTypesByEvent = async (
  eventId: string
): Promise<TicketType[]> => {
  const response: DynamoDBScanResponse = await client.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      IndexName: "EventIdIndex", // Índice secundário necessário no DynamoDB
      KeyConditionExpression: "event_id = :eid",
      ExpressionAttributeValues: marshall({ ":eid": eventId }),
    })
  );

  return response.Items
    ? response.Items.map((item) => unmarshall(item) as TicketType)
    : [];
};

// Atualizar um tipo de ingresso
export const updateTicketType = async (
  ticketId: string,
  ticketData: Partial<TicketType>
): Promise<TicketType> => {
  const response: DynamoDBUpdateItemResponse = await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: ticketId }),
      UpdateExpression: "SET #n = :n, #p = :p, #qa = :qa, #ua = :ua",
      ExpressionAttributeNames: {
        "#n": "name",
        "#p": "price",
        "#qa": "quantity_available",
        "#ua": "updated_at",
      },
      ExpressionAttributeValues: marshall({
        ":n": ticketData.name || "",
        ":p": ticketData.price || 0,
        ":qa": ticketData.quantity_available || 0,
        ":ua": getCurrentISOString(),
      }),
      ReturnValues: "ALL_NEW",
    })
  );

  return unmarshall(response.Attributes!) as TicketType;
};

// Excluir um tipo de ingresso
export const deleteTicketType = async (ticketId: string): Promise<void> => {
  await client.send(
    new DeleteItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: ticketId }),
    })
  );
};
