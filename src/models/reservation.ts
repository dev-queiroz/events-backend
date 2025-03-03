import mongoose from "mongoose";

export interface Reservation {
  id: string;
  customer_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  total_price: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  updated_at: string;
  qr_code?: string | null | undefined;
}

// Schema do Mongoose para Reservation
export const ReservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true, index: true },
  event_id: { type: String, required: true, index: true },
  ticket_type_id: { type: String, required: true },
  quantity: { type: Number, required: true },
  total_price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending",
  },
  qr_code: { type: String },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export const ReservationModel = mongoose.model(
  "Reservation",
  ReservationSchema
);
