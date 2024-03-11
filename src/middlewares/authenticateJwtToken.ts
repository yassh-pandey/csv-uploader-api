import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils';

function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    let token = '';
    if (authHeader && authHeader.split(' ').length >= 1) {
        token = authHeader && authHeader.split(' ')[1];
    }

    if (token.length === 0) {
        return res.status(401).json({
            error: {
                message: 'Please send authorization token.',
            },
        });
    }

    const result = verifyJwtToken(token);

    if (!result.success) {
        return res.status(403).json({ error: result.error });
    }
    res.locals.user = result.data;
    next();
}

export default authenticateToken;
