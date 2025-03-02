import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  JWT_SECRET: process.env.JWT_SECRET || "seu-segredo-aqui",
  DYNAMODB_TABLE_USERS: "Users",
  DYNAMODB_TABLE_EVENTS: "Events",
  DYNAMODB_TABLE_TICKETS: "TicketTypes",
  DYNAMODB_TABLE_RESERVATIONS: "Reservations",
  DYNAMODB_TABLE_PAYMENTS: "Payments",
  S3_BUCKET: "event-images",
};
