import { Request, Response, Router } from 'express';

import { GridService } from '../services/gridService';
import { GridState } from '../types/grid.types';
import { HttpError } from '../utils/errors';

const router: Router = Router();

// Root endpoint to return the grid
router.get('/', (req: Request, res: Response) => {
    const grid: GridState = GridService.getInstance().getCurrentGridState();

    res.json({
        values: grid.values,
        timestamp: grid.timestamp.toISOString(),
        secret: grid.secret
    });
});

// PUT endpoint to update the bias and refresh the grid
router.post('/set-bias', (req: Request, res: Response) => {
    try {
        GridService.getInstance().setBias(req.body.bias);
        res.json({ message: 'Bias set successfully' });
    } catch (error) {
        if (error instanceof HttpError) {
            res.status(error.statusCode).json({
                error: error.message,
                ...error.extras
            });
        }
    }
});

export default router;
