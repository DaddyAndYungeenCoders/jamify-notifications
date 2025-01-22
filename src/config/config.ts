import {Config} from "../models/interfaces/config.interface";
import {Algorithm} from "jsonwebtoken";

export const config: Config = {
    mode: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost',
    activemq: {
        host: process.env.ACTIVEMQ_HOST || 'localhost',
        port: parseInt(process.env.ACTIVEMQ_PORT || '61613'),
        username: process.env.ACTIVEMQ_USERNAME || 'myuser',
        password: process.env.ACTIVEMQ_PASSWORD || 'mypwd',
    },
    ws: {
        notificationChannel: 'new-notification',
        token: process.env.WS_API_TOKEN || 'token',
    },
    jwt: {
        algorithms: ['RS256'] as Algorithm[],
        jwksUri: process.env.JWT_JWKS_URI || 'https://jamify.daddyornot.xyz/jamify-uaa/oauth/.well-known/jwks.json'
    },
};