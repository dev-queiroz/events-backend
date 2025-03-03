import { Payment, PaymentModel } from "../models/payment";
import { getCurrentISOString } from "../utils/dateUtils";
import { confirmReservation } from "./reservationService";

export const createPayment = async (
  reservationId: string,
  amount: number,
  paymentMethod: string
): Promise<Payment> => {
  const payment: Payment = {
    id: crypto.randomUUID(),
    reservation_id: reservationId,
    amount,
    payment_method: paymentMethod,
    status: "pending",
    transaction_id: undefined,
    created_at: getCurrentISOString(),
    updated_at: getCurrentISOString(),
  };

  await PaymentModel.create(payment);
  return payment;
};

export const processPayment = async (
  paymentId: string,
  transactionId: string
): Promise<Payment> => {
  const payment = await PaymentModel.findOne({ id: paymentId }).exec();
  if (!payment) throw new Error("Payment not found");

  const result = await PaymentModel.findOneAndUpdate(
    { id: paymentId },
    {
      status: "completed",
      transaction_id: transactionId,
      updated_at: getCurrentISOString(),
    },
    { new: true }
  ).exec();

  if (!result) throw new Error("Payment not found");
  await confirmReservation(payment.reservation_id); // Confirma a reserva associada
  return result.toObject() as Payment;
};

export const getPaymentById = async (paymentId: string): Promise<Payment> => {
  const payment = await PaymentModel.findOne({ id: paymentId }).exec();
  if (!payment) throw new Error("Payment not found");
  return payment.toObject() as Payment;
};
