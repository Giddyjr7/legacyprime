import { api } from './api';

export interface HealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  message?: string;
}

class HealthService {
  private static instance: HealthService;
  private status: HealthStatus = {
    isHealthy: true,
    lastChecked: new Date()
  };
  private checkInterval: number | null = null;

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  private startMonitoring() {
    // Check health immediately
    this.checkHealth();

    // Set up interval for regular checks
    this.checkInterval = window.setInterval(() => {
      this.checkHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkHealth() {
    try {
      await api.get('/health', {
        timeout: 5000 // Short timeout for health checks
      });

      this.updateStatus(true);
    } catch (error) {
      this.updateStatus(false, this.getErrorMessage(error));
    }
  }

  private updateStatus(isHealthy: boolean, message?: string) {
    const newStatus = {
      isHealthy,
      lastChecked: new Date(),
      message
    };

    // Only dispatch event if status changed
    if (this.status.isHealthy !== isHealthy) {
      window.dispatchEvent(new CustomEvent('health-status-change', {
        detail: newStatus
      }));
    }

    this.status = newStatus;
  }

  private getErrorMessage(error: any): string {
    if (error.response) {
      switch (error.response.status) {
        case 503:
          return 'Service is currently undergoing maintenance. Please try again later.';
        default:
          return 'The service is experiencing issues. Our team has been notified.';
      }
    }
    return 'Unable to connect to the service. Please check your internet connection.';
  }

  public getStatus(): HealthStatus {
    return { ...this.status };
  }

  public async warmupBackend(): Promise<void> {
    try {
      // Make a request to wake up the backend
      await api.get('/health', {
        timeout: 10000
      });

      // Update status
      this.updateStatus(true, 'Backend is ready');
    } catch (error) {
      this.updateStatus(false, 'Backend is still initializing. Please wait...');
      throw error;
    }
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

export default HealthService.getInstance();