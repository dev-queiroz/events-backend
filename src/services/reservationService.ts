import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { env } from '../config/env';
import { Reservation } from '../models/reservation';
import { DynamoDBGetItemResponse, DynamoDBScanResponse, DynamoDBUpdateItemResponse } from '../types/dynamodb';
import { generateQRCode } from '../utils/generateQRCode';
import { getCurrentISOString } from '../utils/dateUtils';

const client = new DynamoDBClient({ region: env.AWS_REGION });

// Criar uma nova reserva
export const createReservation = async (reservationData: Partial<Reservation>, customerId: string): Promise<Reservation> => {
  const { event_id, ticket_type_id, quantity } = reservationData;

  const ticketResponse: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: ticket_type_id }),
    })
  );

  if (!ticketResponse.Item) throw new Error('Ticket type not found');
  const ticketData = unmarshall(ticketResponse.Item) as { price: number; quantity_available: number };
  if (ticketData.quantity_available < quantity!) throw new Error('Insufficient tickets');

  const total_price = ticketData.price * quantity!;
  const reservation: Reservation = {
    id: crypto.randomUUID(),
    customer_id: customerId,
    event_id: event_id || '',
    ticket_type_id: ticket_type_id || '',
    quantity: quantity || 0,
    total_price,
    status: 'pending',
    qr_code: undefined,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await client.send(
    new PutItemCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      Item: marshall(reservation),
    })
  );

  await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: ticket_type_id }),
      UpdateExpression: 'SET quantity_available = :qa',
      ExpressionAttributeValues: marshall({ ':qa': ticketData.quantity_available - quantity! }),
    })
  );

  return reservation;
};

// Listar reservas por cliente
export const getReservationsByCustomer = async (customerId: string): Promise<Reservation[]> => {
  const response: DynamoDBScanResponse = await client.send(
    new QueryCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      IndexName: 'CustomerIdIndex', // Índice secundário necessário
      KeyConditionExpression: 'customer_id = :cid',
      ExpressionAttributeValues: marshall({ ':cid': customerId }),
    })
  );

  return response.Items ? response.Items.map(item => unmarshall(item) as Reservation) : [];
};

// Obter uma reserva por ID
export const getReservationById = async (reservationId: string): Promise<Reservation> => {
  const response: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      Key: marshall({ id: reservationId }),
    })
  );

  if (!response.Item) throw new Error('Reservation not found');
  return unmarshall(response.Item) as Reservation;
};

// Cancelar uma reserva
export const cancelReservation = async (reservationId: string): Promise<void> => {
  const reservationResponse: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      Key: marshall({ id: reservationId }),
    })
  );

  if (!reservationResponse.Item) throw new Error('Reservation not found');
  const reservation = unmarshall(reservationResponse.Item) as Reservation;

  await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      Key: marshall({ id: reservationId }),
      UpdateExpression: 'SET #s = :s, #ua = :ua',
      ExpressionAttributeNames: { '#s': 'status', '#ua': 'updated_at' },
      ExpressionAttributeValues: marshall({ ':s': 'cancelled', ':ua': getCurrentISOString() }),
    })
  );

  const ticketResponse: DynamoDBGetItemResponse = await client.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: reservation.ticket_type_id }),
    })
  );

  const ticketData = unmarshall(ticketResponse.Item!) as { quantity_available: number };
  await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_TICKETS,
      Key: marshall({ id: reservation.ticket_type_id }),
      UpdateExpression: 'SET quantity_available = :qa',
      ExpressionAttributeValues: marshall({ ':qa': ticketData.quantity_available + reservation.quantity }),
    })
  );
};

// Confirmar reserva com QR code
export const confirmReservation = async (reservationId: string): Promise<Reservation> => {
  const reservation = await getReservationById(reservationId);
  if (reservation.status !== 'pending') throw new Error('Reservation already processed');

  const qrCode = await generateQRCode(reservation);
  const response: DynamoDBUpdateItemResponse = await client.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_RESERVATIONS,
      Key: marshall({ id: reservationId }),
      UpdateExpression: 'SET #s = :s, #qr = :qr, #ua = :ua',
      ExpressionAttributeNames: { '#s': 'status', '#qr': 'qr_code', '#ua': 'updated_at' },
      ExpressionAttributeValues: marshall({
        ':s': 'paid',
        ':qr': qrCode,
        ':ua': getCurrentISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    })
  );

  return unmarshall(response.Attributes!) as Reservation;
};