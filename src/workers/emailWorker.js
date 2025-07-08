const { parentPort, workerData } = require('worker_threads');

// Initialize logger first
let logger;
try {
  logger = require('../utils/logger');
} catch (error) {
  console.error('Failed to load logger:', error.message);
  process.exit(1);
}

// Initialize email service
const { sendETicket, sendPaymentConfirmation } = require('../services/emailService');

// Initialize Supabase client
let supabase;
try {
  const { createClient } = require('@supabase/supabase-js');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  logger.error('Failed to initialize Supabase client:', error.message);
  process.exit(1);
}

class EmailWorker {
  constructor() {
    this.isProcessing = false;
    this.queue = [];
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Add email task to queue
  addToQueue(task) {
    this.queue.push(task);
    logger.info(`Email task added to queue`, { 
      taskType: task.type, 
      bookingId: task.bookingId,
      queueLength: this.queue.length 
    });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process email queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Starting email queue processing`, { queueLength: this.queue.length });

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      
      try {
        await this.processEmailTask(task);
        logger.info(`Email task processed successfully`, { 
          taskType: task.type, 
          bookingId: task.bookingId 
        });
      } catch (error) {
        logger.error(`Email task failed`, { 
          taskType: task.type, 
          bookingId: task.bookingId, 
          error: error.message 
        });
        
        // Retry logic
        if (task.retryCount < this.maxRetries) {
          task.retryCount = (task.retryCount || 0) + 1;
          task.retryAfter = Date.now() + this.retryDelay * task.retryCount;
          
          // Add back to queue for retry
          setTimeout(() => {
            this.queue.unshift(task);
            if (!this.isProcessing) {
              this.processQueue();
            }
          }, this.retryDelay * task.retryCount);
          
          logger.info(`Email task scheduled for retry`, { 
            taskType: task.type, 
            bookingId: task.bookingId, 
            retryCount: task.retryCount 
          });
        } else {
          // Max retries reached, mark as failed
          await this.markEmailAsFailed(task);
          logger.error(`Email task failed permanently after ${this.maxRetries} retries`, { 
            taskType: task.type, 
            bookingId: task.bookingId 
          });
        }
      }
    }

    this.isProcessing = false;
    logger.info(`Email queue processing completed`);
  }

  // Process individual email task
  async processEmailTask(task) {
    switch (task.type) {
      case 'e-ticket':
        await this.sendETicket(task);
        break;
      case 'payment-confirmation':
        await this.sendPaymentConfirmation(task);
        break;
      default:
        throw new Error(`Unknown email task type: ${task.type}`);
    }
  }

  // Send e-ticket email
  async sendETicket(task) {
    const { bookingId, userEmail } = task;

    // Fetch booking data with flight details
    let { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    }

    // Fetch outbound flight
    if (booking.outbound_flight_id) {
      const { data: outbound, error: outboundError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', booking.outbound_flight_id)
        .single();
      if (!outboundError) booking.outbound_flight = outbound;
    }

    // Fetch return flight (if roundtrip)
    if (booking.trip_type === 'roundtrip' && booking.return_flight_id) {
      const { data: ret, error: retError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', booking.return_flight_id)
        .single();
      if (!retError) booking.return_flight = ret;
    }

    // Fetch passengers
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', bookingId);

    if (passengersError) {
      throw new Error(`Failed to fetch passengers: ${passengersError.message}`);
    }

    // Send e-ticket email
    await sendETicket(booking, passengers, userEmail);

    // Update booking status to indicate e-ticket sent
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        e_ticket_sent: true, 
        e_ticket_sent_at: new Date().toISOString() 
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.warn(`Failed to update e-ticket sent status`, { 
        bookingId, 
        error: updateError.message 
      });
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(task) {
    const { bookingId, paymentData, userEmail } = task;

    // Fetch booking data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      throw new Error(`Failed to fetch booking: ${bookingError.message}`);
    }

    // Send payment confirmation email
    await sendPaymentConfirmation(booking, paymentData, userEmail);
  }

  // Mark email as failed in database
  async markEmailAsFailed(task) {
    try {
      const { error } = await supabase
        .from('email_logs')
        .insert({
          booking_id: task.bookingId,
          email_type: task.type,
          status: 'failed',
          error_message: `Failed after ${this.maxRetries} retries`,
          sent_at: new Date().toISOString()
        });

      if (error) {
        logger.error(`Failed to log email failure`, { error: error.message });
      }
    } catch (error) {
      logger.error(`Error marking email as failed`, { error: error.message });
    }
  }
}

// Initialize worker
const emailWorker = new EmailWorker();

// Handle messages from main thread
parentPort.on('message', (message) => {
  switch (message.type) {
    case 'send-e-ticket':
      emailWorker.addToQueue({
        type: 'e-ticket',
        bookingId: message.bookingId,
        userEmail: message.userEmail,
        retryCount: 0
      });
      break;
      
    case 'send-payment-confirmation':
      emailWorker.addToQueue({
        type: 'payment-confirmation',
        bookingId: message.bookingId,
        paymentData: message.paymentData,
        userEmail: message.userEmail,
        retryCount: 0
      });
      break;
      
    case 'shutdown':
      logger.info('Email worker shutting down');
      process.exit(0);
      break;
      
    default:
      logger.warn(`Unknown message type: ${message.type}`);
  }
});

// Handle worker errors
process.on('uncaughtException', (error) => {
  logger.error('Email worker uncaught exception', { error: error.message });
  parentPort.postMessage({ type: 'error', error: error.message });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Email worker unhandled rejection', { reason: reason.toString() });
  parentPort.postMessage({ type: 'error', error: reason.toString() });
});

// Send ready signal
parentPort.postMessage({ type: 'ready' }); 