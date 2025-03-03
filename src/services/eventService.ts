import { Event, EventModel } from "../models/event";
import { getCurrentISOString } from "../utils/dateUtils";

export const createEvent = async (
  eventData: Partial<Event>,
  organizerId: string,
  image?: Buffer
): Promise<Event> => {
  const event: Event = {
    id: crypto.randomUUID(),
    organizer_id: organizerId,
    title: eventData.title || "",
    description: eventData.description || "",
    date: eventData.date || "",
    location: eventData.location || "",
    latitude: eventData.latitude,
    longitude: eventData.longitude,
    category: eventData.category || "",
    image_url: image
      ? Buffer.from(image).toString("base64")
      : eventData.image_url, // Armazenar como base64 ou URL externa
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await EventModel.create(event);
  return event;
};

export const getEvents = async (): Promise<Event[]> => {
  const events = await EventModel.find().exec();
  return events.map((event) => event.toObject() as Event);
};

export const getEventById = async (eventId: string): Promise<Event> => {
  const event = await EventModel.findOne({ id: eventId }).exec();
  if (!event) throw new Error("Event not found");
  return event.toObject() as Event;
};

export const updateEvent = async (
  eventId: string,
  eventData: Partial<Event>,
  image?: Buffer
): Promise<Event> => {
  const updatedEvent = {
    ...eventData,
    image_url: image
      ? Buffer.from(image).toString("base64")
      : eventData.image_url,
    updated_at: getCurrentISOString(),
  };

  const result = await EventModel.findOneAndUpdate(
    { id: eventId },
    updatedEvent,
    { new: true }
  ).exec();

  if (!result) throw new Error("Event not found");
  return result.toObject() as Event;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const result = await EventModel.deleteOne({ id: eventId }).exec();
  if (result.deletedCount === 0) throw new Error("Event not found");
};
