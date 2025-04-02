
import * as mqtt from 'mqtt';

// MQTT connection configuration
const MQTT_SERVER = 'wss://broker.emqx.io:8084/mqtt'; // Example public MQTT broker

// MQTT client instance
let client: mqtt.MqttClient | null = null;

/**
 * Connect to the MQTT broker
 * @returns The MQTT client instance
 */
export const connectMqtt = (): Promise<mqtt.MqttClient> => {
  return new Promise((resolve, reject) => {
    try {
      client = mqtt.connect(MQTT_SERVER);
      
      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        resolve(client as mqtt.MqttClient);
      });
      
      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error connecting to MQTT broker:', error);
      reject(error);
    }
  });
};

/**
 * Subscribe to an MQTT topic
 * @param topic The topic to subscribe to
 * @param callback Function to call when a message is received
 */
export const subscribeTopic = (
  topic: string, 
  callback: (message: string) => void
): void => {
  if (!client) {
    console.error('MQTT client not connected');
    return;
  }
  
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to topic ${topic}:`, err);
      return;
    }
    
    console.log(`Subscribed to topic: ${topic}`);
  });
  
  client.on('message', (receivedTopic, message) => {
    if (receivedTopic === topic) {
      try {
        const messageStr = message.toString();
        callback(messageStr);
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    }
  });
};

/**
 * Unsubscribe from an MQTT topic
 * @param topic The topic to unsubscribe from
 */
export const unsubscribeTopic = (topic: string): void => {
  if (!client) {
    console.error('MQTT client not connected');
    return;
  }
  
  client.unsubscribe(topic, (err) => {
    if (err) {
      console.error(`Error unsubscribing from topic ${topic}:`, err);
      return;
    }
    
    console.log(`Unsubscribed from topic: ${topic}`);
  });
};

/**
 * Publish a message to an MQTT topic
 * @param topic The topic to publish to
 * @param message The message to publish
 */
export const publishMessage = (topic: string, message: string): void => {
  if (!client) {
    console.error('MQTT client not connected');
    return;
  }
  
  client.publish(topic, message, (err) => {
    if (err) {
      console.error(`Error publishing to topic ${topic}:`, err);
      return;
    }
    
    console.log(`Published message to topic: ${topic}`);
  });
};

/**
 * Disconnect from the MQTT broker
 */
export const disconnectMqtt = (): void => {
  if (!client) {
    console.log('MQTT client already disconnected');
    return;
  }
  
  client.end();
  client = null;
  console.log('Disconnected from MQTT broker');
};

export default {
  connectMqtt,
  subscribeTopic,
  unsubscribeTopic,
  publishMessage,
  disconnectMqtt
};
