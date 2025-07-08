const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { log } = require('winston');

// Create transporter
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    transporter.verify((err, success) => {
      if (err) {
        console.error('SMTP Connection Failed:', err);
      } else {
        console.log('SMTP Connection Successful:', success);
      }
    });
  } catch (error) {
    console.log(error);
    
    logger.error('Failed to initialize email transporter:', error.message);
    transporter = null;
  }
} else {
  logger.warn('SMTP credentials not configured, email service will be disabled');
}

// Check if email service is available
function isEmailAvailable() {
  return transporter !== null;
}

// Send e-ticket email
async function sendETicket(bookingData, passengers, userEmail) {
  if (!isEmailAvailable()) {
    logger.warn('Email service not available, skipping e-ticket email');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const htmlContent = generateETicketHTML(bookingData, passengers);
    
    const mailOptions = {
      from: `"ThenaAir" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `E-Ticket Confirmation - Booking ${bookingData.id.slice(-8).toUpperCase()}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`E-ticket email sent successfully to ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send e-ticket email:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendPaymentConfirmation(bookingData, paymentData, userEmail) {
  if (!isEmailAvailable()) {
    logger.warn('Email service not available, skipping payment confirmation email');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation - ThenaAir</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Successful</h1>
            <h2>ThenaAir Flight Booking</h2>
          </div>
          <div class="content">
            <div class="success">
              <h3>Payment Confirmed!</h3>
              <p>Your payment of ₹${bookingData.total_price.toLocaleString()} has been successfully processed.</p>
              <p><strong>Transaction ID:</strong> ${paymentData.provider_ref}</p>
              <p><strong>Booking ID:</strong> ${bookingData.id.slice(-8).toUpperCase()}</p>
            </div>
            <p>Your e-ticket will be sent to this email address shortly.</p>
            <p>Thank you for choosing ThenaAir!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"ThenaAir" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Payment Confirmation - Booking ${bookingData.id.slice(-8).toUpperCase()}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Payment confirmation email sent to ${userEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send payment confirmation email:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate e-ticket HTML
function generateETicketHTML(bookingData, passengers) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const passengerRows = passengers.map((passenger, index) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${passenger.full_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${passenger.age}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${passenger.gender}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${passenger.passenger_type}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>E-Ticket - ThenaAir</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .flight-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .passenger-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .passenger-table th { background: #667eea; color: white; padding: 10px; text-align: left; }
        .passenger-table td { padding: 8px; border: 1px solid #ddd; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .qr-code { text-align: center; margin: 20px 0; }
        .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ ThenaAir</h1>
          <h2>E-Ticket Confirmation</h2>
          <p>Booking ID: ${bookingData.id.slice(-8).toUpperCase()}</p>
        </div>
        
        <div class="content">
          <div class="ticket-info">
            <h3>🎫 Ticket Information</h3>
            <p><strong>Status:</strong> <span style="color: green;">CONFIRMED</span></p>
            <p><strong>Booking Date:</strong> ${formatDate(bookingData.created_at)}</p>
            <p><strong>Trip Type:</strong> ${bookingData.trip_type.toUpperCase()}</p>
            <p><strong>Cabin Class:</strong> ${bookingData.cabin_class}</p>
            <p><strong>Total Amount:</strong> ₹${bookingData.total_price.toLocaleString()}</p>
          </div>

          <div class="flight-details">
            <h3>🛫 Flight Details</h3>
            <p><strong>Flight:</strong> ${bookingData.outbound_flight?.flight_number || 'N/A'}</p>
            <p><strong>Airline:</strong> ${bookingData.outbound_flight?.airline || 'N/A'}</p>
            <p><strong>From:</strong> ${bookingData.outbound_flight?.from_airport || 'N/A'}</p>
            <p><strong>To:</strong> ${bookingData.outbound_flight?.to_airport || 'N/A'}</p>
            <p><strong>Departure:</strong> ${formatDate(bookingData.outbound_flight?.departure_time || '')} (${formatTime(bookingData.outbound_flight?.departure_time || '')})</p>
            <p><strong>Arrival:</strong> ${formatDate(bookingData.outbound_flight?.arrival_time || '')} (${formatTime(bookingData.outbound_flight?.arrival_time || '')})</p>
          </div>

          ${bookingData.return_flight ? `
          <div class="flight-details">
            <h3>🛬 Return Flight Details</h3>
            <p><strong>Flight:</strong> ${bookingData.return_flight.flight_number}</p>
            <p><strong>Airline:</strong> ${bookingData.return_flight.airline}</p>
            <p><strong>From:</strong> ${bookingData.return_flight.from_airport}</p>
            <p><strong>To:</strong> ${bookingData.return_flight.to_airport}</p>
            <p><strong>Departure:</strong> ${formatDate(bookingData.return_flight.departure_time)} (${formatTime(bookingData.return_flight.departure_time)})</p>
            <p><strong>Arrival:</strong> ${formatDate(bookingData.return_flight.arrival_time)} (${formatTime(bookingData.return_flight.arrival_time)})</p>
          </div>
          ` : ''}

          <div class="passenger-table">
            <h3>👥 Passenger Details</h3>
            <table class="passenger-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                ${passengerRows}
              </tbody>
            </table>
          </div>

          <div class="important">
            <h4>⚠️ Important Information</h4>
            <ul>
              <li>Please arrive at the airport 2 hours before departure for domestic flights</li>
              <li>Carry a valid government ID for verification</li>
              <li>This e-ticket serves as your boarding pass</li>
              <li>Keep this email handy for check-in</li>
            </ul>
          </div>

          <div class="qr-code">
            <p><strong>QR Code for Check-in:</strong></p>
            <p style="font-family: monospace; font-size: 18px; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${bookingData.id.slice(-12).toUpperCase()}
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing ThenaAir!</p>
          <p>For support, contact us at support@thenaair.com</p>
          <p>© 2025 ThenaAir. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  isEmailAvailable,
  sendETicket,
  sendPaymentConfirmation,
  generateETicketHTML
}; 