import logger from "../config/logger";
import { WebsocketApiService } from "./websocket-api.service";
import { Notification } from "../models/interfaces/notification.interface";
import { v4 as uuidv4 } from "uuid";

interface MessageValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Service for handling notifications.
 */
export class NotificationService {

    static instance: NotificationService;
    private websocketApiService: WebsocketApiService;

    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor() {
        this.websocketApiService = WebsocketApiService.getInstance();
    }

    /**
     * Returns the singleton instance of NotificationService.
     * @returns {NotificationService} The singleton instance of NotificationService.
     */
    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Processes a notification.
     * @param {Notification} notification - The notification to be processed.
     * @returns {Promise<Notification>} The processed notification.
     * @throws Will throw an error if the notification is invalid or if the room/user does not exist.
     */
    async processNotification(notification: Notification): Promise<Notification> {
        // Validate the notification
        const validationResult = this.validateNotification(notification);
        if (!validationResult.isValid) {
            logger.error(`Invalid notification data: ${validationResult.error}`);
            throw new Error(validationResult.error || 'Invalid notification data');
        }
        // TODO : do different things for notif -> send mail, push notif etc.
        const newNotif = this.createBaseNotification(notification);

        // check if room or user exists before sending to the queue
        if (await this.websocketApiService.checkRoomOrUserExistsForNotif(notification)) {
            // if (true) {
            // Send the message to the queue
            return newNotif;
        } else {
            // TODO: handle error in a better way
            throw new Error('Room or user does not exist');
        }
    }

    /**
     * Validates the notification.
     * @param {Notification} notification - The notification to be validated.
     * @returns {MessageValidationResult} The validation result.
     */
    private validateNotification(notification: Notification): MessageValidationResult {
        if (!notification.content) {
            return { isValid: false, error: 'Notification content is required' };
        }

        if (!notification.title) {
            return { isValid: false, error: 'Notification title is required' };
        }

        if (!notification.roomId && !notification.destId) {
            return { isValid: false, error: 'Either roomId or destId is required' };
        }
        return { isValid: true };
    }

    /**
     * Creates the base notification data.
     * @param {Notification} message - The notification to be processed.
     * @returns {Notification} The base notification data.
     */
    private createBaseNotification(message: Notification): Notification {
        return {
            id: NotificationService.generateNotifId(),
            title: message.title,
            content: message.content,
            timestamp: new Date().toISOString(),
            ...(message.roomId ? { roomId: message.roomId } : { destId: message.destId })
        };
    }

    /**
     * Generates a unique notification ID.
     * @returns {string} A unique notification ID.
     */
    public static generateNotifId(): string {
        return `notif_${Date.now()}_${uuidv4().toString()}`;
    }
}