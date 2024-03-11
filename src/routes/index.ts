import express, { Request, Response } from 'express';
import accessTokenRouter from './access-token';
import fileExistsRouter from './file-exists';
import authRouter from './auth';
import uploadsRouter from './uploads';

const routeHandler = express.Router();

routeHandler.get('/', (req: Request, res: Response) => {
    res.send('At least I am working :)');
});

routeHandler.use('/auth', authRouter);

routeHandler.use('/file-exists', fileExistsRouter);

routeHandler.use('/access-token', accessTokenRouter);

routeHandler.all('*', (req, res) => {
    return res.status(404).json({
        error: {
            message: 'Not found.',
        },
    });
});

export default routeHandler;

export { uploadsRouter };
