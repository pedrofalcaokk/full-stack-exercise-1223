import { GridState } from '../types/grid.types';
import {
    GRID_BIAS_COOLDOWN,
    GRID_BIAS_WEIGHT,
    GRID_CHAR_LIST,
    GRID_COLUMN_SIZE,
    GRID_GRACE_PERIOD,
    GRID_REFRESH_INTERVAL,
    GRID_ROW_SIZE,
    GRID_STOP_INTERVAL
} from '../utils/constants';
import { HttpError } from '../utils/errors';
import { generateBiasPositions, generateGridValues, generateSecretCode } from '../utils/gridUtils';

export class GridService {
    private static instance: GridService;
    private current: GridState;
    private previous: GridState | null;
    private refreshInterval: NodeJS.Timeout | null;
    private lastBiasUpdate: number;
    private lastGridRequest: number;

    private constructor() {
        this.current = {
            values: [],
            bias: '',
            timestamp: new Date(),
            secret: '',
        };
        this.previous = null;
        this.refreshInterval = null;
        this.lastBiasUpdate = 0;
        this.lastGridRequest = 0;
    }

    public static getInstance(): GridService {
        if (!GridService.instance) {
            GridService.instance = new GridService();
        }

        return GridService.instance;
    }

    public getCurrentGridState(): GridState {
        this.lastGridRequest = Date.now();

        if (!this.refreshInterval) {
            this.refreshGrid();
        }

        return this.current;
    }

    public setBias(bias: string): void {
        const currentTime: number = Date.now();

        if (currentTime - this.lastBiasUpdate < GRID_BIAS_COOLDOWN) {
            throw new HttpError(429, "Please wait 4 seconds between bias updates", {
                remainingTime: (GRID_BIAS_COOLDOWN - (currentTime - this.lastBiasUpdate)) / 1000
            });
        }

        if (!GRID_CHAR_LIST.includes(bias) && bias !== '') {
            throw new HttpError(400, "Invalid value");
        }

        this.current.bias = bias;
        this.lastBiasUpdate = currentTime;
        this.refreshGrid();
    }

    // Utility function to stop automatically generating the grid
    public stopGridGeneration(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Utility function to get the grid values
    public getGridValues(secret: string): string[][] | null {
        if (this.current.secret === secret) {
            return this.current.values;
        }
        if (this.previous?.secret === secret) {
            return this.previous.values;
        }
        return null;
    }

    // Utility function to check if the grid is initialized and up to date
    public isGridInitialized(): boolean {
        const currentTime: number = Date.now(),
            isGridUpToDate: boolean = (currentTime - this.lastGridRequest < GRID_STOP_INTERVAL);

        return !!this.current.values.length && isGridUpToDate;
    }

    // Utility function to check if the grid is getting generated automatically
    public isGridGenerating(): boolean {
        return this.refreshInterval !== null;
    }

    // Utility function to refresh the grid
    private refreshGrid(): void {
        const currentTime: number = Date.now();
        if (currentTime - this.lastGridRequest > GRID_STOP_INTERVAL) {
            this.stopGridGeneration();
            return;
        }

        const bias: string = this.current.bias;
        const biasPositions = generateBiasPositions(bias, GRID_BIAS_WEIGHT, GRID_ROW_SIZE, GRID_COLUMN_SIZE);
        const values: string[][] = generateGridValues(bias, biasPositions, GRID_ROW_SIZE, GRID_COLUMN_SIZE, GRID_CHAR_LIST);
        const timestamp = new Date();

        if (!this.refreshInterval) {
            this.refreshInterval = setInterval(this.refreshGrid.bind(this), GRID_REFRESH_INTERVAL);
        }

        // Store current state as previous before updating
        this.previous = { ...this.current };

        // Update current state
        this.current = {
            values,
            bias,
            timestamp,
            secret: generateSecretCode(values, timestamp),
        };

        // Clear previous state after grace period
        setTimeout(() => {
            this.previous = null;
        }, GRID_GRACE_PERIOD);
    }
}
