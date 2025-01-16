import express, {Application} from 'express';
import cors from 'cors';
import {createServer, Server as HttpServer} from 'http';
import {messageRoutes} from './routes/notification.route';
import {errorHandler} from './middleware/error-handler';
import {Config} from './models/interfaces/config.interface';
import {QueueService} from './services/queue.service';
import logger from './config/logger';
import {setupSwagger} from "./config/swagger";
import {authMiddleware} from "./middleware/jwt.middleware";

/**
 * Class representing the main application.
 */
export class App {
    public app: Application;
    public server: HttpServer;
    private queueService: QueueService;

    /**
     * Create an instance of the App.
     * @param {Config} config - The configuration object.
     */
    constructor(config: Config) {
        this.app = express();
        this.server = createServer(this.app);



        this.queueService = QueueService.getInstance(config);

        this.initializeServices();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeSwagger();
        this.initializeErrorHandling();
    }

    /**
     * Initialize services required by the application.
     * @private
     * @async
     */
    private async initializeServices(): Promise<void> {
        try {
            await this.queueService.connect();
            logger.info('Queue service initialized successfully');
        } catch (error) {
            logger.error(`Error initializing queue service: ${error}`);
            throw error;
        }
    }

    /**
     * Initialize middlewares for the application.
     * @private
     */
    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(cors({
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }

    /**
     * Initialize routes for the application.
     * @private
     */
    private initializeRoutes(): void {
        this.app.use('/api/notifications', authMiddleware, messageRoutes());
    }

    /**
     * Initialize Swagger for API documentation.
     * @private
     */
    private initializeSwagger(): void {
        setupSwagger(this.app);
    }

    /**
     * Initialize error handling middleware.
     * @private
     */
    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    /**
     * Get the HTTP server instance.
     * @returns {HttpServer} The HTTP server instance.
     */
    public getServer(): HttpServer {
        return this.server;
    }
}