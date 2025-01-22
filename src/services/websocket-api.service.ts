import {RequestContext} from "../utils/request-context";
import {Notification} from "../models/interfaces/notification.interface";
import {config} from "../config/config";

/**
 * Service for handling WebSocket API calls.
 */
export class WebsocketApiService {

    private static instance: WebsocketApiService;

    private constructor() {
    }

    /**
     * Returns the singleton instance of WebsocketApiService.
     * @returns The singleton instance of WebsocketApiService.
     */
    public static getInstance(): WebsocketApiService {
        if (!WebsocketApiService.instance) {
            WebsocketApiService.instance = new WebsocketApiService();
        }
        return WebsocketApiService.instance;
    }

    async checkRoomOrUserExistsForNotif(notification: Notification): Promise<boolean> {
        const token = RequestContext.getInstance().getToken();

        const endpoint = notification.roomId ?
            `rooms/existsById/${notification.roomId}`
            :
            `users/existsById/${notification.destId}`;

        try {
            const response = await fetch(`${config.ws.baseUri}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-jamify-token': `${config.ws.token}`,
                },
            });

            if (!response.ok) {
                // handle error in a better way
                throw new Error('Failed to check room or user existence : ' + JSON.stringify(response));
            } else {
                return true;
            }

        } catch (error) {
            throw new Error('Failed to check room or user existence' + error);
        }
    }
}