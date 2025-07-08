const PDFDocument = require('pdfkit');

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function generateTicketPDF(booking, passengers, res, outboundFlight, returnFlight) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${booking.id}.pdf"`);
  doc.pipe(res);

  // Branding
  doc
    .fontSize(28)
    .fillColor('#7B8BFF')
    .font('Helvetica-Bold')
    .text('ThenaAir', { align: 'center' })
    .moveDown(0.2)
    .fontSize(20)
    .text('E-Ticket Confirmation', { align: 'center' })
    .moveDown(0.1)
    .fontSize(14)
    .text(`Booking ID: ${booking.id.slice(-8).toUpperCase()}`, { align: 'center' })
    .moveDown(1);

  // Ticket Information
  doc
    .fontSize(16)
    .fillColor('#4F6DF5')
    .font('Helvetica-Bold')
    .text('Ticket Information')
    .moveDown(0.2)
    .fontSize(12)
    .fillColor('#4F6DF5')
    .text(`Status: ${booking.status ? booking.status.toUpperCase() : 'CONFIRMED'} `, { link: '', underline: false })
    .fillColor('black')
    .font('Helvetica')
    .text(`Booking Date: ${formatDateTime(booking.created_at)}`)
    .text(`Trip Type: ${booking.trip_type ? booking.trip_type.toUpperCase() : ''}`)
    .text(`Cabin Class: ${booking.cabin_class}`)
    .text(`Total Amount: Rs. ${booking.total_price?.toLocaleString() || ''}`)
    .moveDown(0.5);

  // Flight Details
  doc
    .fontSize(15)
    .font('Helvetica-Bold')
    .fillColor('black')
    .text('Flight Details')
    .fontSize(12)
    .font('Helvetica')
    .moveDown(0.2)
    .text(`Flight: ${outboundFlight?.flight_number || ''}`)
    .text(`Airline: ${outboundFlight?.airline || ''}`)
    .text(`From: ${outboundFlight?.from_airport || ''}`)
    .text(`To: ${outboundFlight?.to_airport || ''}`)
    .text(`Departure: ${outboundFlight ? formatDateTime(outboundFlight.departure_time) : ''}`)
    .text(`Arrival: ${outboundFlight ? formatDateTime(outboundFlight.arrival_time) : ''}`)
    .moveDown(0.5);

  // Return Flight Details (if roundtrip)
  if (booking.trip_type && booking.trip_type.toLowerCase() === 'roundtrip' && returnFlight) {
    doc
      .fontSize(15)
      .font('Helvetica-Bold')
      .text('Return Flight Details')
      .fontSize(12)
      .font('Helvetica')
      .moveDown(0.2)
      .text(`Flight: ${returnFlight.flight_number}`)
      .text(`Airline: ${returnFlight.airline}`)
      .text(`From: ${returnFlight.from_airport}`)
      .text(`To: ${returnFlight.to_airport}`)
      .text(`Departure: ${formatDateTime(returnFlight.departure_time)}`)
      .text(`Arrival: ${formatDateTime(returnFlight.arrival_time)}`)
      .moveDown(0.5);
  }

  // Passenger Details Table
  doc
    .fontSize(15)
    .font('Helvetica-Bold')
    .text('Passenger Details')
    .moveDown(0.2);

  // Table layout
  const tableTop = doc.y + 5;
  const startX = 50;
  const rowHeight = 24;
  const colWidths = [40, 150, 60, 80, 80];
  const headers = ['No.', 'Name', 'Age', 'Gender', 'Type'];

  // Draw header background
  doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fillAndStroke('#F3F4F6', 'black');
  doc.fillColor('black').font('Helvetica-Bold').fontSize(12);

  // Draw header text
  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x, tableTop + 6, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  });

  // Draw rows
  doc.font('Helvetica').fontSize(12);
  passengers.forEach((p, i) => {
    const y = tableTop + rowHeight * (i + 1);
    // Row background
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fillAndStroke(i % 2 === 0 ? '#FFF' : '#F9FAFB', 'black');
    // Row text
    let x = startX;
    doc.fillColor('black').text(String(i + 1), x, y + 6, { width: colWidths[0], align: 'center' });
    x += colWidths[0];
    doc.text(p.full_name || '', x, y + 6, { width: colWidths[1], align: 'center' });
    x += colWidths[1];
    doc.text(p.age ? String(p.age) : '', x, y + 6, { width: colWidths[2], align: 'center' });
    x += colWidths[2];
    doc.text(p.gender || '', x, y + 6, { width: colWidths[3], align: 'center' });
    x += colWidths[3];
    doc.text(p.passenger_type || '', x, y + 6, { width: colWidths[4], align: 'center' });
  });

  // Draw vertical lines
  let xLine = startX;
  for (let i = 0; i <= colWidths.length; i++) {
    doc.moveTo(xLine, tableTop).lineTo(xLine, tableTop + rowHeight * (passengers.length + 1)).stroke();
    if (i < colWidths.length) xLine += colWidths[i];
  }
  // Draw horizontal lines
  for (let i = 0; i <= passengers.length + 1; i++) {
    const yLine = tableTop + rowHeight * i;
    doc.moveTo(startX, yLine).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), yLine).stroke();
  }

  doc.moveDown(2);
  doc.end();
}

module.exports = { generateTicketPDF }; 