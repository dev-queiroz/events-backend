import QRCode from "qrcode";
import { Reservation } from "../models/reservation";

export const generateQRCode = async (
  reservation: Reservation
): Promise<string> => {
  try {
    const qrData = JSON.stringify({
      reservationId: reservation.id,
      eventId: reservation.event_id,
      customerId: reservation.customer_id,
      ticketTypeId: reservation.ticket_type_id,
      quantity: reservation.quantity,
      totalPrice: reservation.total_price,
    });

    const qrCodeString = await QRCode.toString(qrData, {
      type: "svg",
      errorCorrectionLevel: "H",
    });
    return qrCodeString;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const validateQRCode = async (
  qrCodeString: string
): Promise<boolean> => {
  try {
    return !!qrCodeString;
  } catch (error) {
    return false;
  }
};
