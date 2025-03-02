export interface Event {
  id: string; // UUID como chave primária
  organizer_id: string; // Referência ao usuário organizador (UUID)
  title: string; // Título do evento
  description: string; // Descrição detalhada
  date: string; // ISO string para data e hora
  location: string; // Local físico do evento
  latitude?: number; // Coordenada (opcional)
  longitude?: number; // Coordenada (opcional)
  category: string; // Categoria (ex.: "música", "esportes")
  image_url?: string; // URL pública do S3 para a imagem
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
