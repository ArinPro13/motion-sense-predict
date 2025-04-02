
import mqtt from 'mqtt';

export type SensorData = {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
};

export type MQTTConfig = {
  brokerUrl: string;
  username?: string;
  password?: string;
  clientId: string;
  topic: string;
};

class MQTTService {
  private client: mqtt.MqttClient | null = null;
  private onMessageCallback: ((data: SensorData) => void) | null = null;
  private config: MQTTConfig | null = null;
  private isConnected: boolean = false;

  // Configure MQTT connection
  configure(config: MQTTConfig): void {
    this.config = config;
  }

  // Connect to MQTT broker
  connect(onMessageCallback: (data: SensorData) => void): Promise<void> {
    if (!this.config) {
      return Promise.reject(new Error('MQTT not configured'));
    }

    return new Promise((resolve, reject) => {
      try {
        // Mock MQTT connection for the demo
        console.log(`Connecting to MQTT broker: ${this.config?.brokerUrl}`);
        
        // In a real implementation, connect to the broker
        // this.client = mqtt.connect(this.config.brokerUrl, {
        //   clientId: this.config.clientId,
        //   username: this.config.username,
        //   password: this.config.password
        // });

        // For demo, simulate a connection with a mock client
        this.client = {
          on: (event: string, callback: any) => {
            if (event === 'connect') {
              setTimeout(() => {
                callback();
                this.isConnected = true;
              }, 500);
            }
          },
          subscribe: (topic: string, callback: any) => {
            console.log(`Subscribed to topic: ${topic}`);
            callback(null);
          },
          unsubscribe: (topic: string, callback: any) => {
            console.log(`Unsubscribed from topic: ${topic}`);
            callback(null);
          },
          publish: (topic: string, message: string) => {
            console.log(`Published to topic: ${topic}, message: ${message}`);
          },
          end: (force: boolean, callback: any) => {
            this.isConnected = false;
            console.log('MQTT connection ended');
            if (callback) callback();
          }
        } as unknown as mqtt.MqttClient;

        this.onMessageCallback = onMessageCallback;

        this.client.on('connect', () => {
          console.log('Connected to MQTT broker');
          
          if (this.config && this.client) {
            this.client.subscribe(this.config.topic, (err) => {
              if (err) {
                console.error('Failed to subscribe to topic:', err);
                reject(err);
              } else {
                console.log(`Subscribed to topic: ${this.config.topic}`);
                // Start generating mock data
                this.startMockDataGeneration();
                resolve();
              }
            });
          }
        });

        // Handle errors
        this.client.on('error', (err) => {
          console.error('MQTT connection error:', err);
          reject(err);
        });

      } catch (error) {
        console.error('Error connecting to MQTT broker:', error);
        reject(error);
      }
    });
  }

  // Simulate receiving data for demo purposes
  private startMockDataGeneration(): void {
    if (!this.onMessageCallback) return;

    // Generate mock sensor data every second
    const interval = setInterval(() => {
      if (!this.isConnected || !this.onMessageCallback) {
        clearInterval(interval);
        return;
      }

      // Generate random sensor values between -10 and 10
      const randomValue = () => Math.random() * 20 - 10;
      
      const mockData: SensorData = {
        acceleration: {
          x: randomValue(),
          y: randomValue(),
          z: randomValue(),
        },
        gyroscope: {
          x: randomValue(),
          y: randomValue(),
          z: randomValue(),
        },
        timestamp: Date.now(),
      };

      this.onMessageCallback(mockData);
    }, 1000);
  }

  // Disconnect from MQTT broker
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client && this.isConnected) {
        this.client.end(true, () => {
          this.isConnected = false;
          this.onMessageCallback = null;
          console.log('Disconnected from MQTT broker');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Check if connected
  isConnectedToBroker(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
const mqttService = new MQTTService();
export default mqttService;
