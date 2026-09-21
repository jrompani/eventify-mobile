import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type TicketProductStatus = 'ACTIVE' | 'PAUSED' | 'SOLD_OUT';
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export type TicketProduct = {
  id: string;
  experienceId: string;
  name: string;
  priceAmount: number;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
  availableQuantity: number;
  status: TicketProductStatus;
};

export type OrderItem = {
  id: string;
  ticketProductId: string;
  ticketProductName: string;
  quantity: number;
  unitPriceAmount: number;
  lineTotalAmount: number;
};

export type CommerceOrder = {
  id: string;
  experienceId: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  items: OrderItem[];
};

export async function listTicketProducts(experienceId: string) {
  return apiFetch<TicketProduct[]>(`/experiences/${experienceId}/ticket-products`);
}

export async function createTicketProduct(
  session: AuthSession,
  experienceId: string,
  input: { name: string; priceAmount: number; currency: string; quantityTotal: number }
) {
  return apiFetch<TicketProduct>(`/experiences/${experienceId}/ticket-products`, {
    method: 'POST',
    ...authOptionsFor(session),
    body: JSON.stringify(input),
  });
}

export async function createOrder(
  session: AuthSession,
  experienceId: string,
  ticketProductId: string,
  quantity: number,
  idempotencyKey: string
) {
  return apiFetch<CommerceOrder>(`/experiences/${experienceId}/orders`, {
    method: 'POST',
    ...authOptionsFor(session),
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ ticketProductId, quantity }),
  });
}

export async function markOrderPaid(session: AuthSession, orderId: string) {
  return apiFetch<CommerceOrder>(`/orders/${orderId}/mark-paid`, {
    method: 'POST',
    ...authOptionsFor(session),
  });
}
