export interface TicketType {
  id: string; // UUID como chave primária
  event_id: string; // Referência ao evento (UUID)
  name: string; // Nome do tipo de ingresso (ex.: "VIP", "Pista")
  price: number; // Preço em valor numérico
  quantity_available: number; // Quantidade disponível
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
