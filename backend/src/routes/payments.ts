import { Request, Response, Router } from 'express';

import { PaymentService } from '../services/paymentService';
import { HttpError } from '../utils/errors';

const router: Router = Router();

// Root endpoint to return the list of payments
router.get('/', (req: Request, res: Response) => {
    const payments = PaymentService.getInstance().getPaymentList();
    res.json({ payments });
});

// PUT endpoint to add a new payment
router.post('/add', (req: Request, res: Response) => {
    try {
        // Validate the request body
        if (!req.body.name || req.body.amount === undefined || !req.body.secret) {
            res.status(400).json({ error: "Invalid request" });
            return;
        }

        PaymentService.getInstance().addPayment(req.body.name, req.body.amount, req.body.secret);
        res.json({ message: 'Payment added successfully' });
    } catch (error) {
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({ error: error.message });
        }
    }
});

export default router;
