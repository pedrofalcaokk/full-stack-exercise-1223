import { HttpErrorExtras } from "../types/httpError.types";

/**
 * Custom HTTP Error class for handling API errors
 */
export class HttpError extends Error {
    extras: HttpErrorExtras | null;
    /**
     * Creates a new HTTP Error
     * @param statusCode The HTTP status code for the error (e.g. 400, 404, 500)
     * @param message Detailed error message describing what went wrong
     * @param extras Extra information regarding the error
     */
    constructor(public statusCode: number, message: string, extras?: HttpErrorExtras) {
        super(message);
        this.name = 'HttpError';
        this.extras = extras ?? null;
    }
}
