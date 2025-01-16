import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {Application} from "express";
import {config} from "./config";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Node.js Notification Service",
            version: "1.0.0",
            description: "API pour service de notification",
            termsOfService: "http://example.com/terms",
            contact: {
                name: "Jamify",
                email: "contact@exemple.com",
                url: "http://exemple.com",
            },
            license: {
                name: "Apache 2.0",
                url: "https://www.apache.org/licenses/LICENSE-2.0.html",
            },
        },
        servers: [
            {
                url: `http://${config.host}:${config.port}`,
                description: `${config.mode} server`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Notification: {
                    type: "object",
                    properties: {
                        id: {type: "string", description: "Unique identifier for the notification"},
                        title: {type: "string", description: "Title of the notification"},
                        content: {type: "string", description: "Content of the notification"},
                        destId: {
                            type: "string",
                            required: false,
                            description: "Unique identifier for the destination user (needs either destId or roomId)"
                        },
                        roomId: {
                            type: "string",
                            required: false,
                            description: "Unique identifier for the room (needs either destId or roomId)"
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            required: false,
                            description: "Timestamp of the notification"
                        },
                        metadata: {
                            type: "object",
                            required: false,
                            description: "Additional metadata for the notification. Useful for example for the websocket channel the notification should be sent to"
                        },
                    },
                    required: ["id", "content", "destId || roomId"],
                },
            },
        },
    },
    apis: ["src/routes/*.route.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
};
