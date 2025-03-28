import {Client, connect} from 'stompit';
import {Config} from "../models/interfaces/config.interface";
import {ConnectOptions} from "../models/interfaces/connect-options.interface";
import logger from "../config/logger";
import {QueueEnum} from "../models/enums/queue.enum";
import {Notification} from "../models/interfaces/notification.interface";
import {NotificationService} from "./notification.service";

/**
 * Service for managing the connection to ActiveMQ and handling message publishing and subscribing.
 */
export class QueueService {
    private publishClient: Client | null = null;
    private subscribeClient: Client | null = null;
    private readonly config: Config;
    private isActiveMqAvailable: boolean = false; // Connection status flag

    private static instance: QueueService;

    /**
     * Private constructor to enforce singleton pattern.
     * @param config - Configuration object.
     */
    private constructor(config: Config) {
        this.config = config;
    }

    /**
     * Returns the singleton instance of QueueService.
     * @param config - Configuration object.
     * @returns The singleton instance of QueueService.
     */
    public static getInstance(config: Config): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService(config);
        }
        return QueueService.instance;
    }

    /**
     * Connects to ActiveMQ with retry logic.
     * @param retries - Number of retry attempts.
     * @param delayMs - Delay between retries in milliseconds.
     * @returns A promise that resolves when the connection is successful.
     */
    public async connect(retries: number = 10, delayMs: number = 10000): Promise<void> {
        const connectOptions: ConnectOptions = {
            host: this.config.activemq.host,
            port: this.config.activemq.port,
            connectHeaders: {
                host: '/',
                login: this.config.activemq.username,
                passcode: this.config.activemq.password
            }
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.publishClient = await this.createClient(connectOptions);
                this.subscribeClient = await this.createClient(connectOptions);
                await this.setupConsumer();
                this.isActiveMqAvailable = true;
                logger.info('Successfully connected to ActiveMQ');
                return;
            } catch (error) {
                logger.error(`Failed to connect to ActiveMQ (attempt ${attempt} of ${retries}):`, error);
                if (attempt < retries) {
                    await this.delay(delayMs);
                } else {
                    this.isActiveMqAvailable = false;
                    throw error;
                }
            }
        }
    }

    /**
     * Delays execution for a specified number of milliseconds.
     * @param ms - Number of milliseconds to delay.
     * @returns A promise that resolves after the specified delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Creates a client connection to ActiveMQ.
     * @param options - Connection options.
     * @returns A promise that resolves with the client instance.
     */
    private createClient(options: ConnectOptions): Promise<Client> {
        return new Promise((resolve, reject) => {
            connect(options, (error: Error | null, client: Client) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(client);
                }
            });
        });
    }

    /**
     * Publishes a message to the ActiveMQ queue.
     * @param notification - The notification to publish.
     * @param queue - The queue to publish the message to.
     * @returns A promise that resolves when the message is published.
     * @throws Error if the messaging service is unavailable or the publisher is not connected.
     */
    public async publishNotification(notification: Notification, queue: QueueEnum): Promise<void> {
        logger.info(`Try to publish notification: ${JSON.stringify(notification)} to queue ${queue}`);
        if (!this.isActiveMqAvailable) {
            logger.error('Messaging service is unavailable due to connection issues');
            throw new Error('Messaging service is unavailable due to connection issues');
        }

        if (!this.publishClient) {
            logger.error('Publisher not connected');
            throw new Error('Publisher not connected');
        }

        return new Promise((resolve, reject) => {
            const headers = {
                destination: `/queue/${queue}`,
                'content-type': 'application/json'
            };

            if (this.publishClient) {
                const frame = this.publishClient.send(headers);
                frame.write(JSON.stringify(notification));
                frame.end();
                logger.info(`Message published: ${JSON.stringify(notification)} to queue ${queue}`);
                resolve();
            } else {
                reject(new Error('Publish client is null'));
            }
        });
    }

    /**
     * Sets up the consumer to listen for messages from the ActiveMQ queue.
     * @returns A promise that resolves when the consumer is set up.
     * @throws Error if the subscriber is not connected.
     */
    private async setupConsumer(): Promise<void> {
        if (!this.subscribeClient) {
            logger.error('Subscriber not connected');
            throw new Error('Subscriber not connected');
        }

        const subscribeHeaders = {
            destination: `/queue/${QueueEnum.NOTIFICATION_IN}`,
            ack: 'client-individual'
        };

        this.subscribeClient.subscribe(subscribeHeaders, (error: Error | null, incomingNotif) => {
            if (error) {
                logger.error(`Subscribe error: ${error}`);
                return;
            }

            incomingNotif.readString('utf-8', async (error: Error | null, body?: string) => {
                if (error || !body) {
                    logger.error(`Read notification error: ${error}`);
                    if (this.subscribeClient) {
                        this.subscribeClient.nack(incomingNotif);
                    }
                    return;
                }

                try {
                    const notificationService = NotificationService.getInstance();
                    const newNotif = JSON.parse(body) as Notification;
                    const notifToPublish: Notification = await notificationService.processNotification(newNotif);
                    await this.handleNewNotification(notifToPublish);
                    if (this.subscribeClient) {
                        this.subscribeClient.ack(incomingNotif);
                    }
                } catch (error) {
                    logger.error(`Process message error for ${JSON.stringify(body)}: ${error}`);
                    if (this.subscribeClient) {
                        this.subscribeClient.nack(incomingNotif);
                    }
                }
            });
        });
    }

    /**
     * Handles the processed notification by broadcasting it to the appropriate WebSocket room.
     * @param notification - The notification to process.
     * @returns A promise that resolves when the message is broadcasted.
     * @throws Error if the notification is invalid or if the room/user does not exist.
     */
    private async handleNewNotification(notification: Notification): Promise<void> {
        logger.info(`Processing notification: ${JSON.stringify(notification)}`);
        try {
            notification.metadata = {
                channel: this.config.ws.notificationChannel
            }
            await this.publishNotification(notification, QueueEnum.NOTIFICATION_OUT);
        } catch (error) {
            logger.error(`Error publishing message: ${error}`);
            throw error;
        }
    }

    /**
     * Disconnects from ActiveMQ.
     * @returns A promise that resolves when the disconnection is complete.
     * @throws Error if disconnection fails.
     */
    public async disconnect(): Promise<void> {
        try {
            if (this.publishClient) {
                this.publishClient.disconnect();
            }
            if (this.subscribeClient) {
                this.subscribeClient.disconnect();
            }
            this.isActiveMqAvailable = false; // Set connection status to false
        } catch (error) {
            logger.error('Error disconnecting from ActiveMQ:', error);
            throw error;
        }
    }
}