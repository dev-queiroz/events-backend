import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://default:default@localhost/events?retryWrites=true&w=majority",
  JWT_SECRET: process.env.JWT_SECRET || "seu-segredo-padrao",
  NODE_ENV: process.env.NODE_ENV || "development",
};
