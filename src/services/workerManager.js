const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('../utils/logger');

class WorkerManager {
  constructor() {
    this.workers = [];
    this.currentWorkerIndex = 0;
    this.maxWorkers = process.env.MAX_EMAIL_WORKERS || 2;
    this.workerPath = path.join(__dirname, '../workers/emailWorker.js');
  }

  // Initialize workers
  async initialize() {
    logger.info(`Initializing ${this.maxWorkers} email workers`);
    
    for (let i = 0; i < this.maxWorkers; i++) {
      await this.createWorker();
    }
    
    logger.info(`Worker manager initialized with ${this.workers.length} workers`);
  }

  // Create a new worker
  async createWorker() {
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.workerPath, {
        env: process.env
      });

      worker.on('message', (message) => {
        this.handleWorkerMessage(worker, message);
      });

      worker.on('error', (error) => {
        logger.error('Worker error', { error: error.message });
        this.handleWorkerError(worker, error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          logger.warn(`Worker exited with code ${code}`);
        }
        this.handleWorkerExit(worker);
      });

      // Wait for worker to be ready
      worker.once('message', (message) => {
        if (message.type === 'ready') {
          this.workers.push(worker);
          logger.info(`Worker ${this.workers.length} ready`);
          resolve(worker);
        }
      });

      // Timeout for worker initialization
      setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 10000);
    });
  }

  // Handle worker messages
  handleWorkerMessage(worker, message) {
    switch (message.type) {
      case 'ready':
        logger.info('Worker ready');
        break;
      case 'error':
        logger.error('Worker reported error', { error: message.error });
        break;
      default:
        logger.info('Worker message', { type: message.type });
    }
  }

  // Handle worker errors
  handleWorkerError(worker, error) {
    logger.error('Worker error occurred', { error: error.message });
    
    // Remove worker from pool
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }

    worker.terminate();

    this.createWorker().catch(err => {
      logger.error('Failed to create replacement worker', { error: err.message });
    });
  }

  handleWorkerExit(worker) {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
      logger.info(`Worker removed from pool. Active workers: ${this.workers.length}`);
    }
  }

  getNextWorker() {
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }

    const worker = this.workers[this.currentWorkerIndex];
    this.currentWorkerIndex = (this.currentWorkerIndex + 1) % this.workers.length;
    
    return worker;
  }

  async sendETicket(bookingId, userEmail) {
    const worker = this.getNextWorker();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email sending timeout'));
      }, 30000);

      worker.postMessage({
        type: 'send-e-ticket',
        bookingId,
        userEmail
      });

      resolve({ success: true, message: 'Email queued for sending' });
    });
  }

  async sendPaymentConfirmation(bookingId, paymentData, userEmail) {
    const worker = this.getNextWorker();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Email sending timeout'));
      }, 30000);

      worker.postMessage({
        type: 'send-payment-confirmation',
        bookingId,
        paymentData,
        userEmail
      });

      // Listen for completion (optional - workers handle their own queue)
      resolve({ success: true, message: 'Email queued for sending' });
    });
  }

  getStatus() {
    return {
      activeWorkers: this.workers.length,
      maxWorkers: this.maxWorkers,
      currentWorkerIndex: this.currentWorkerIndex
    };
  }

  async shutdown() {
    logger.info('Shutting down worker manager');
    
    const shutdownPromises = this.workers.map(worker => {
      return new Promise((resolve) => {
        worker.postMessage({ type: 'shutdown' });
        worker.once('exit', () => resolve());
        
        setTimeout(() => {
          worker.terminate();
          resolve();
        }, 5000);
      });
    });

    await Promise.all(shutdownPromises);
    this.workers = [];
    
    logger.info('Worker manager shutdown complete');
  }
}

module.exports = new WorkerManager(); 