import {Algorithm} from "jsonwebtoken";

export interface Config {
    mode: string;
    port: number;
    host: string;
    activemq: {
        host: string;
        port: number;
        username: string;
        password: string;
    };
    ws: {
        notificationChannel: string;
        token: string;
    };
    jwt: {
        algorithms: Algorithm[];
        jwksUri: string;
    };
}