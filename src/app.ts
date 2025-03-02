import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import organizerRoutes from "./routes/organizerRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/ticket-types", ticketRoutes);
app.use("/reservations", reservationRoutes);
app.use("/payments", paymentRoutes);
app.use("/organizer", organizerRoutes);

app.use(errorMiddleware);

export default app;
