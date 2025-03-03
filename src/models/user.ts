import mongoose from "mongoose";

export interface User {
  id: string; // UUID gerado manualmente (não usaremos _id do MongoDB)
  email: string; // Email único
  password: string; // Password
  role: "organizer" | "customer"; // Papel do usuário
  name: string; // Nome completo
  phone?: string; // Telefone (opcional)
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Schema do Mongoose para User
export const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true }, // Campo interno, não exposto na interface pública
  role: { type: String, enum: ["organizer", "customer"], required: true },
  name: { type: String, required: true },
  phone: { type: String },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export const UserModel = mongoose.model("User", UserSchema);
