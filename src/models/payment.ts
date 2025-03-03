import mongoose from "mongoose";

export interface Payment {
  id: string; // UUID gerado manualmente
  reservation_id: string; // Referência à reserva
  amount: number; // Valor pago
  payment_method: string; // Método de pagamento
  status: "pending" | "completed" | "failed"; // Estado do pagamento
  transaction_id?: string; // ID da transação (opcional)
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Schema do Mongoose para Payment
export const PaymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reservation_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  transaction_id: { type: String },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export const PaymentModel = mongoose.model("Payment", PaymentSchema);
