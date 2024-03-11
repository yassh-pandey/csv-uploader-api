import { Request, Response } from 'express';

const genericIssError = function (req: Request, res: Response) {
    return res.status(500).json({
        error: {
            message:
                'Some unexpected error happened while creating the user. Please try again later. Contact support if the problem still persists.',
        },
    });
};

export default genericIssError;
