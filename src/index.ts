import dotenv from 'dotenv';
if (process?.env?.NODE_ENV === 'development') {
    dotenv.config();
}
import express, { Express } from 'express';

import { neonConfig } from '@neondatabase/serverless';

import cors from 'cors';
import ws from 'ws';

import routeHandler, { uploadsRouter } from './routes';

const port = process?.env?.PORT || 3000;
neonConfig.webSocketConstructor = ws;

const app: Express = express();
const uploadApp: Express = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', uploadApp);
app.use('/', routeHandler);
uploadApp.use('/', uploadsRouter);

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
