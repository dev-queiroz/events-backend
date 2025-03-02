export interface Payment {
  id: string; // UUID como chave primária
  reservation_id: string; // Referência à reserva (UUID)
  amount: number; // Valor pago
  payment_method: string; // Método (ex.: "cartão", "Pix")
  status: "pending" | "completed" | "failed"; // Estado do pagamento
  transaction_id?: string; // ID retornado pelo gateway (opcional)
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
