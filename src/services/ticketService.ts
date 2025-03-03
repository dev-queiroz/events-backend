import { TicketType, TicketTypeModel } from "../models/ticketType";
import { getCurrentISOString } from "../utils/dateUtils";

export const createTicketType = async (
  ticketData: Partial<TicketType>
): Promise<TicketType> => {
  const ticket: TicketType = {
    id: crypto.randomUUID(),
    event_id: ticketData.event_id || "",
    name: ticketData.name || "",
    price: ticketData.price || 0,
    quantity_available: ticketData.quantity_available || 0,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await TicketTypeModel.create(ticket);
  return ticket;
};

export const getTicketTypesByEvent = async (
  eventId: string
): Promise<TicketType[]> => {
  return TicketTypeModel.find({ event_id: eventId }).exec();
};

export const updateTicketType = async (
  ticketId: string,
  ticketData: Partial<TicketType>
): Promise<TicketType> => {
  const updatedTicket = {
    ...ticketData,
    updated_at: getCurrentISOString(),
  };

  const result = await TicketTypeModel.findOneAndUpdate(
    { id: ticketId },
    updatedTicket,
    { new: true }
  ).exec();

  if (!result) throw new Error("Ticket type not found");
  return result.toObject() as TicketType;
};

export const deleteTicketType = async (ticketId: string): Promise<void> => {
  const result = await TicketTypeModel.deleteOne({ id: ticketId }).exec();
  if (result.deletedCount === 0) throw new Error("Ticket type not found");
};
