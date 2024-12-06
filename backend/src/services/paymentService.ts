import { Payment } from "../types/payment.types";
import { HttpError } from "../utils/errors";
import { GridService } from "./gridService";

export class PaymentService {
    private static instance: PaymentService;
    private payments: Payment[] = [];

    private constructor() { }

    public static getInstance(): PaymentService {
        if (!PaymentService.instance) {
            PaymentService.instance = new PaymentService();
        }

        return PaymentService.instance;
    }

    public getPaymentList(): Payment[] {
        return this.payments;
    }

    public addPayment(name: string, amount: number, secret: string): void {
        const gridService: GridService = GridService.getInstance();
        // Check if the grid is initialized and up to date
        if (!gridService.isGridInitialized()) {
            throw new HttpError(500, 'Grid is not initialized or is not up to date');
        }

        this.validatePaymentName(name);
        this.validatePaymentAmount(amount);

        // Get the grid values
        const gridValues = gridService.getGridValues(secret);
        if (!gridValues) {
            throw new HttpError(401, 'Invalid secret code');
        }

        const payment: Payment = {
            name: name,
            amount: amount,
            grid: gridValues,
            secret: secret,
        };

        // Check if the payment does not already exist in the array
        if (this.payments.some(p => p.name === payment.name && p.secret === payment.secret)) {
            throw new HttpError(409, 'Payment already exists');
        }

        this.payments.push(payment);
    }

    private validatePaymentName(name: string): void {
        if (name.length < 3 || name.length > 100) {
            throw new HttpError(400, 'Invalid payment name, it should have between 3 and 100 characters');
        }
    }

    private validatePaymentAmount(amount: number): void {
        if (amount <= 0) {
            throw new HttpError(400, 'Invalid payment amount');
        }
    }
}
