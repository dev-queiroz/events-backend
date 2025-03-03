import mongoose from "mongoose";

export interface Event {
  id: string; // UUID gerado manualmente
  organizer_id: string; // Referência ao usuário organizador
  title: string; // Título do evento
  description: string; // Descrição detalhada
  date: string; // ISO string para data e hora
  location: string; // Local físico do evento
  latitude?: number; // Coordenada (opcional)
  longitude?: number; // Coordenada (opcional)
  category: string; // Categoria do evento
  image_url?: string; // URL da imagem (armazenada externamente ou em string)
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Schema do Mongoose para Event
export const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  organizer_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  category: { type: String, required: true },
  image_url: { type: String },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export const EventModel = mongoose.model("Event", EventSchema);
