import {Router} from 'express';
import logger from "../config/logger";

/**
 * Defines the message routes for the application.
 * @returns The configured router.
 */
export const messageRoutes = () => {
    const router = Router();

    router.get('/', (req, res) => {
        logger.info("Notification API");
        res.json("Notification API");
    });

    return router;
};