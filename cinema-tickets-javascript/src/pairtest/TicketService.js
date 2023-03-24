import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js'
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js'

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #ticketPrice = {
    adult: 20,
    child: 10,
    infant: 0
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    if (typeof accountId !== 'number' || accountId < 0) {
      throw new InvalidPurchaseException('Invalid account id')
    }
    if (ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException('No tickets requested')
    }
    let typeCount = {
      adult: 0,
      child: 0,
      infant: 0
    }
    ticketTypeRequests.forEach(ticketTypeRequest => {
      if (!(ticketTypeRequest instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException('Invalid ticket type request')
      }
      const ticketType = ticketTypeRequest.getTicketType().toLowerCase();
      const ticketCount = ticketTypeRequest.getNoOfTickets();
      typeCount[ticketType] += ticketCount;
    })
    const totalTicketCount = Object.values(typeCount).reduce((a, b) => a + b, 0);
    if (totalTicketCount == 0) {
      throw new InvalidPurchaseException('You must purchase at least 1 ticket')
    }
    if (totalTicketCount > 20) {
      throw new InvalidPurchaseException('A maximum of 20 tickets can be purchased at a time')
    }
    if (typeCount.child > typeCount.adult || typeCount.infant > typeCount.adult) {
      throw new InvalidPurchaseException('At minor cannot travel without an adult')
    }
    const totalPrice = this.#calculatePrice(typeCount.adult, typeCount.child);
    new TicketPaymentService().makePayment(accountId, totalPrice);
    const seatAmount = this.#calculateSeatAmount(typeCount.adult, typeCount.child);
    new SeatReservationService().reserveSeat(accountId, seatAmount)
  }

  #calculatePrice(adult, child) {
    return this.#ticketPrice.adult * adult + this.#ticketPrice.child * child;
  }

  #calculateSeatAmount(adult, child) {
    return adult + child;
  }
}
