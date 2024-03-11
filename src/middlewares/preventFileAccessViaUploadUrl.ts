import { Request, Response, NextFunction } from 'express';

const preventFileAccessViaUploadUrl = function (req: Request, res: Response, next: NextFunction) {
    if (req.method === 'GET' && req.originalUrl.startsWith('/uploads')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

export default preventFileAccessViaUploadUrl;
