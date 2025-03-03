import { Reservation, ReservationModel } from "../models/reservation";
import { TicketTypeModel } from "../models/ticketType";
import { getCurrentISOString } from "../utils/dateUtils";
import { generateQRCode } from "../utils/generateQRCode";

export const createReservation = async (
  reservationData: Partial<Reservation>,
  customerId: string
): Promise<Reservation> => {
  const { event_id, ticket_type_id, quantity } = reservationData;

  const ticket = await TicketTypeModel.findOne({ id: ticket_type_id }).exec();
  if (!ticket) throw new Error("Ticket type not found");
  if (ticket.quantity_available < (quantity || 0))
    throw new Error("Insufficient tickets");

  const total_price = ticket.price * (quantity || 0);
  const reservation: Reservation = {
    id: crypto.randomUUID(),
    customer_id: customerId,
    event_id: event_id || "",
    ticket_type_id: ticket_type_id || "",
    quantity: quantity || 0,
    total_price,
    status: "pending",
    qr_code: undefined,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await ReservationModel.create(reservation);
  await TicketTypeModel.updateOne(
    { id: ticket_type_id },
    { quantity_available: ticket.quantity_available - (quantity || 0) }
  ).exec();

  return reservation;
};

export const getReservationsByCustomer = async (
  customerId: string
): Promise<Reservation[]> => {
  const reservations = await ReservationModel.find({ customer_id: customerId }).exec();
  return reservations.map(reservation => reservation.toObject() as Reservation);
};

export const getReservationById = async (
  reservationId: string
): Promise<Reservation> => {
  const reservation = await ReservationModel.findOne({
    id: reservationId,
  }).exec();
  if (!reservation) throw new Error("Reservation not found");
  return reservation.toObject() as Reservation;
};

export const cancelReservation = async (
  reservationId: string
): Promise<void> => {
  const reservation = await ReservationModel.findOne({
    id: reservationId,
  }).exec();
  if (!reservation) throw new Error("Reservation not found");

  await ReservationModel.updateOne(
    { id: reservationId },
    { status: "cancelled", updated_at: getCurrentISOString() }
  ).exec();

  const ticket = await TicketTypeModel.findOne({
    id: reservation.ticket_type_id,
  }).exec();
  if (ticket) {
    await TicketTypeModel.updateOne(
      { id: reservation.ticket_type_id },
      { quantity_available: ticket.quantity_available + reservation.quantity }
    ).exec();
  }
};

export const confirmReservation = async (
  reservationId: string
): Promise<Reservation> => {
  const reservation = await ReservationModel.findOne({
    id: reservationId,
  }).exec();
  if (!reservation) throw new Error("Reservation not found");
  if (reservation.status !== "pending")
    throw new Error("Reservation already processed");

  const qrCode = await generateQRCode(reservation);
  const result = await ReservationModel.findOneAndUpdate(
    { id: reservationId },
    { status: "paid", qr_code: qrCode, updated_at: getCurrentISOString() },
    { new: true }
  ).exec();

  if (!result) throw new Error("Reservation not found");
  return result.toObject() as Reservation;
};
