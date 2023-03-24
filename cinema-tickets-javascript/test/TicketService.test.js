import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import TicketService from "../src/pairtest/TicketService";
import { jest } from '@jest/globals';
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";

describe('TicketService', () => {
  const ticketService = new TicketService();

  describe('InvalidPurchaseException', () => {
    test.each([-1, null, {}, []])('Should Not Accept %p as account ID', (accountId) => {
      expect(() => ticketService.purchaseTickets(accountId, new TicketTypeRequest('ADULT', 1)))
        .toThrowError('Invalid account id');
    });

    test('Should not process empty ticket request', () => {
      expect(() => ticketService.purchaseTickets(1))
        .toThrowError('No tickets requested');
    });

    test('Should not accept invalid ticket types', () => {
      expect(() => ticketService.purchaseTickets(1, {}, {}))
        .toThrowError('Invalid ticket type request');
      expect(() => ticketService.purchaseTickets(1, {}, new TicketTypeRequest('ADULT', 1)))
        .toThrowError('Invalid ticket type request');
    });

    test('Should not accept invalid ticket purchase amounts of 0 or greater than 20', () => {
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 0)))
        .toThrowError('You must purchase at least 1 ticket');
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 21)))
        .toThrowError('A maximum of 20 tickets can be purchased at a time');
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 9),
        new TicketTypeRequest('ADULT', 12)))
        .toThrowError('A maximum of 20 tickets can be purchased at a time');
    })

    test('Should only allow purchase of child/infant ticket when Adult present', () => {
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('CHILD', 1)))
        .toThrowError('At minor cannot travel without an adult');
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('INFANT', 1)))
        .toThrowError('At minor cannot travel without an adult');
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('INFANT', 2)))
        .toThrowError('At minor cannot travel without an adult');
      expect(() => ticketService.purchaseTickets(1, new TicketTypeRequest('ADULT', 1),
        new TicketTypeRequest('CHILD', 2)))
        .toThrowError('At minor cannot travel without an adult');
    })

    test('Should return correct valuation of sale', () => {
      const accountId = 1;
      let expectedPrice = 170;
      const paymentSpy = jest.spyOn(TicketPaymentService.prototype, 'makePayment');
      ticketService.purchaseTickets(accountId,
        new TicketTypeRequest('ADULT', 6),
        new TicketTypeRequest('CHILD', 5),
        new TicketTypeRequest('INFANT', 3));
      expect(paymentSpy).toHaveBeenCalledWith(accountId, expectedPrice);
      expectedPrice = 60;
      ticketService.purchaseTickets(accountId,
        new TicketTypeRequest('ADULT', 2),
        new TicketTypeRequest('CHILD', 2));
      expect(paymentSpy).toHaveBeenCalledWith(accountId, expectedPrice);
    })

    test('Should return correct seat number', () => {
      const accountId = 1;
      let expectedSeatCount = 10;
      const reserveSpy = jest.spyOn(SeatReservationService.prototype, 'reserveSeat');
      ticketService.purchaseTickets(accountId,
        new TicketTypeRequest('ADULT', 6),
        new TicketTypeRequest('CHILD', 4),
        new TicketTypeRequest('INFANT', 3));
      expect(reserveSpy).toHaveBeenCalledWith(accountId, expectedSeatCount)
      expectedSeatCount = 9;
      ticketService.purchaseTickets(accountId,
        new TicketTypeRequest('ADULT', 8),
        new TicketTypeRequest('CHILD', 1),
        new TicketTypeRequest('INFANT', 1));
      expect(reserveSpy).toHaveBeenCalledWith(accountId, expectedSeatCount)
    })
  })

  describe('TypeError', () => {
    test('Should not accept incorrect ticket types', () => {
      expect(() => ticketService.purchaseTickets(1, {}, new TicketTypeRequest('SENIOR', 1)))
        .toThrowError(TypeError)
      expect(() => ticketService.purchaseTickets(1, {}, new TicketTypeRequest('ADULT', "one")))
        .toThrowError(TypeError)
    })
  })
});