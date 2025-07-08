const { generateTicketPDF } = require('../services/pdfService');
const supabase = require('../lib/supabase');

const generateETicket = async(req,res) => {
  const { bookingId } = req.params;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  let outboundFlight = null;
  if (booking.outbound_flight_id) {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', booking.outbound_flight_id)
      .single();
    if (!error) outboundFlight = data;
  }

  let returnFlight = null;
  if (booking.trip_type === 'roundtrip' && booking.return_flight_id) {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', booking.return_flight_id)
      .single();
    if (!error) returnFlight = data;
  }

  const { data: passengers, error: passengerError } = await supabase
    .from('passengers')
    .select('*')
    .eq('booking_id', bookingId);

  if (passengerError) {
    return res.status(500).json({ error: 'Could not fetch passengers' });
  }

  generateTicketPDF(booking, passengers, res, outboundFlight, returnFlight);
}

module.exports = generateETicket;