import {API} from '../models/enums/api.enum';
import {RequestContext} from "../utils/request-context";
import {Notification} from "../models/interfaces/notification.interface";

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
            `/rooms/existsById/${notification.roomId}`
            :
            `/users/existsById/${notification.destId}`;

        try {
            const response = await fetch(`${API.WS.BASE}/${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // handle error in a better way
                throw new Error('Failed to check room or user existence');
            } else {
                return true;
            }

        } catch (error) {
            throw new Error('Failed to check room or user existence');
        }
    }
}