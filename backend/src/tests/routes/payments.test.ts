import express from 'express';
import request from 'supertest';

import gridRouter from '../../routes/grid';
import paymentsRouter from '../../routes/payments';
import { GridService } from '../../services/gridService';

const app = express();
app.use(express.json());

app.use('/grid', gridRouter);
app.use('/payments', paymentsRouter);

describe('Grid API Endpoints', () => {
    beforeAll(async () => {
        jest.useFakeTimers();
    });

    // Make sure the grid is being generated before each test
    beforeEach(async () => {
        await request(app).get('/grid');
    });

    // Make sure the grid stops being generated after each test
    afterEach(async () => {
        GridService.getInstance().stopGridGeneration();
    });

    afterAll(async () => {
        jest.useRealTimers();
    });

    it('Should return the payments list', async () => {
        const response = await request(app).get('/payments');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('payments');
        expect(Array.isArray(response.body.payments)).toBe(true);
        expect(response.body.payments.length).toBe(0);
    });

    it('Should add a new payment to the payments list', async () => {
        const paymentCount: number = (await request(app).get('/payments')).body.payments.length,
            secret: string = (await request(app).get('/grid')).body.secret,
            response = await request(app)
                .post('/payments/add')
                .send({
                    name: 'Payment 1',
                    amount: 100,
                    secret: secret,
                }),
            newPaymentCount: number = (await request(app).get('/payments')).body.payments.length;

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Payment added successfully');
        expect(newPaymentCount).toBe(paymentCount + 1);
    });

    it('Should throw error when trying to add a payment without the grid being up to date', async () => {
        // Advance the timer to make the grid outdated
        jest.advanceTimersByTime(60000);

        const response = await request(app)
            .post('/payments/add')
            .send({
                name: 'Payment 1',
                amount: 100,
                secret: '12',
            });


        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Grid is not initialized or is not up to date');
    });

    it('Should throw error when trying to add a payment with missing attributes', async () => {
        const secret: string = (await request(app).get('/grid')).body.secret,
            response = await request(app)
                .post('/payments/add')
                .send({
                    amount: 100,
                    secret: secret,
                });


        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Invalid request');
    });

    it('Should throw error when trying to add a payment with an invalid name', async () => {
        const secret: string = (await request(app).get('/grid')).body.secret,
            response = await request(app)
                .post('/payments/add')
                .send({
                    name: 'aa',
                    amount: 100,
                    secret: secret,
                });


        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Invalid payment name, it should have between 3 and 100 characters');
    });

    it('Should throw error when trying to add a payment with an invalid amount', async () => {
        const secret: string = (await request(app).get('/grid')).body.secret,
            response = await request(app)
                .post('/payments/add')
                .send({
                    name: 'Payment 1',
                    amount: 0,
                    secret: secret,
                });


        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Invalid payment amount');
    });

    it('Should throw error when trying to add a payment with an invalid secret code', async () => {
        const response = await request(app)
            .post('/payments/add')
            .send({
                name: 'Payment 1',
                amount: 100,
                secret: 'aa',
            });


        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toEqual('Invalid secret code');
    });

    it('Should throw error when trying to add the same payment twice', async () => {
        const secret: string = (await request(app).get('/grid')).body.secret,
            postRequest = {
                name: 'Payment 1',
                amount: 100,
                secret: secret,
            };
        await request(app)
            .post('/payments/add')
            .send(postRequest);
        const response2 = await request(app)
            .post('/payments/add')
            .send(postRequest);


        expect(response2.status).toBe(409);
        expect(response2.body).toHaveProperty('error');
        expect(response2.body.error).toEqual('Payment already exists');
    });
});
