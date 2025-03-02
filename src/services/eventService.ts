import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { env } from "../config/env";
import { Event } from "../models/event";
import {
  DynamoDBGetItemResponse,
  DynamoDBScanResponse,
  DynamoDBUpdateItemResponse,
} from "../types/dynamodb";
import { S3UploadParams } from "../types/s3";
import { getCurrentISOString } from "../utils/dateUtils";

const dynamoClient = new DynamoDBClient({ region: env.AWS_REGION });
const s3Client = new S3Client({ region: env.AWS_REGION });

// Criar um novo evento
export const createEvent = async (
  eventData: Partial<Event>,
  organizerId: string,
  image?: Buffer
): Promise<Event> => {
  const event: Event = {
    id: crypto.randomUUID(),
    organizer_id: organizerId,
    title: eventData.title || "",
    description: eventData.description || "",
    date: eventData.date || "",
    location: eventData.location || "",
    latitude: eventData.latitude,
    longitude: eventData.longitude,
    category: eventData.category || "",
    image_url: undefined,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  if (image) {
    const params: S3UploadParams = {
      Bucket: env.S3_BUCKET,
      Key: `events/${event.id}.jpg`,
      Body: image,
      ContentType: "image/jpeg",
    };
    await s3Client.send(new PutObjectCommand(params));
    event.image_url = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${params.Key}`;
  }

  await dynamoClient.send(
    new PutItemCommand({
      TableName: env.DYNAMODB_TABLE_EVENTS,
      Item: marshall(event),
    })
  );

  return event;
};

// Listar todos os eventos
export const getEvents = async (): Promise<Event[]> => {
  const response: DynamoDBScanResponse = await dynamoClient.send(
    new ScanCommand({ TableName: env.DYNAMODB_TABLE_EVENTS })
  );
  return response.Items
    ? response.Items.map((item) => unmarshall(item) as Event)
    : [];
};

// Obter um evento por ID
export const getEventById = async (eventId: string): Promise<Event> => {
  const response: DynamoDBGetItemResponse = await dynamoClient.send(
    new GetItemCommand({
      TableName: env.DYNAMODB_TABLE_EVENTS,
      Key: marshall({ id: eventId }),
    })
  );

  if (!response.Item) throw new Error("Event not found");
  return unmarshall(response.Item) as Event;
};

// Atualizar um evento
export const updateEvent = async (
  eventId: string,
  eventData: Partial<Event>,
  image?: Buffer
): Promise<Event> => {
  let imageUrl = eventData.image_url;
  if (image) {
    const params: S3UploadParams = {
      Bucket: env.S3_BUCKET,
      Key: `events/${eventId}.jpg`,
      Body: image,
      ContentType: "image/jpeg",
    };
    await s3Client.send(new PutObjectCommand(params));
    imageUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${params.Key}`;
  }

  const response: DynamoDBUpdateItemResponse = await dynamoClient.send(
    new UpdateItemCommand({
      TableName: env.DYNAMODB_TABLE_EVENTS,
      Key: marshall({ id: eventId }),
      UpdateExpression:
        "SET #t = :t, #d = :d, #dt = :dt, #l = :l, #lat = :lat, #lon = :lon, #c = :c, #img = :img, #ua = :ua",
      ExpressionAttributeNames: {
        "#t": "title",
        "#d": "description",
        "#dt": "date",
        "#l": "location",
        "#lat": "latitude",
        "#lon": "longitude",
        "#c": "category",
        "#img": "image_url",
        "#ua": "updated_at",
      },
      ExpressionAttributeValues: marshall({
        ":t": eventData.title || "",
        ":d": eventData.description || "",
        ":dt": eventData.date || "",
        ":l": eventData.location || "",
        ":lat": eventData.latitude,
        ":lon": eventData.longitude,
        ":c": eventData.category || "",
        ":img": imageUrl,
        ":ua": getCurrentISOString(),
      }),
      ReturnValues: "ALL_NEW",
    })
  );

  return unmarshall(response.Attributes!) as Event;
};

// Excluir um evento
export const deleteEvent = async (eventId: string): Promise<void> => {
  await dynamoClient.send(
    new DeleteItemCommand({
      TableName: env.DYNAMODB_TABLE_EVENTS,
      Key: marshall({ id: eventId }),
    })
  );
};
