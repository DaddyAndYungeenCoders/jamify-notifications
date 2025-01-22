import {IApi} from "../interfaces/api.interface";

export const API: IApi = {
    WS: {
        BASE: process.env.WS_BASE_URL || 'http://localhost:3333',
        PRIVATE_ROOM: '/api/rooms/private',
        ADD_USERS_TO_PRIVATE_ROOM: '/api/rooms/private/add-users',
    },

} as const;