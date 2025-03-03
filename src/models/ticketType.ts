import mongoose from "mongoose";

export interface TicketType {
  id: string; // UUID gerado manualmente
  event_id: string; // Referência ao evento
  name: string; // Nome do tipo de ingresso
  price: number; // Preço
  quantity_available: number; // Quantidade disponível
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Schema do Mongoose para TicketType
export const TicketTypeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  event_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity_available: { type: Number, required: true },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export const TicketTypeModel = mongoose.model("TicketType", TicketTypeSchema);
