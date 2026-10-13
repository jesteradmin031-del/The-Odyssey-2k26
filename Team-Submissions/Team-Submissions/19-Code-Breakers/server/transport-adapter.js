/**
 * TODO OPTIONAL INTEGRATION: implement only after receiving approved partner access.
 * This interface is deliberately disconnected from payment/booking actions in the demo.
 * Keep TRANSPORT_CLIENT_ID and TRANSPORT_CLIENT_SECRET on this server.
 * Do not invent partner URLs, fares, or availability. Read the selected partner's docs.
 */
export const transportAdapter = {
  async getQuotes({ origin, destination }) {
    return { available: false, quotes: [], message: 'No transport provider is connected.' };
  },
  async bookRide() {
    // TODO: authenticated user, explicit booking confirmation, server-side quote validation,
    // partner sandbox tests, idempotency key and cancellation workflow before implementing.
    throw new Error('Booking is not implemented. No ride has been requested.');
  },
};
