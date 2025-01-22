import {NextFunction, Request, Response} from 'express';
import logger from "../config/logger";
import {StatusCodes} from "http-status-codes";
import {Notification} from "../models/interfaces/notification.interface";

/**
 * Middleware to validate chat messages.
 * Ensures that the message contains required fields and meets certain conditions.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export function validateMessage(req: Request, res: Response, next: NextFunction) {
    const message: Notification = req.body;

    if (!message.content || (!message.roomId && !message.destId)) {
        logger.error(`Missing required fields : ${message}`);
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Missing required fields'
        });
    }

    if (message.content.length > 1000) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Message content is too long'
        });
    }

    next();
}