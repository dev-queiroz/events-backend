export interface Reservation {
  id: string; // UUID como chave primária
  customer_id: string; // Referência ao cliente (UUID)
  event_id: string; // Referência ao evento (UUID)
  ticket_type_id: string; // Referência ao tipo de ingresso (UUID)
  quantity: number; // Quantidade de ingressos reservados
  total_price: number; // Preço total (price * quantity)
  status: "pending" | "paid" | "cancelled"; // Estado da reserva
  qr_code?: string; // Código QR gerado após pagamento (SVG ou base64)
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
