import express, { Request, Response } from 'express';
import { z } from 'zod';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { authenticateJwtToken } from '../../middlewares';
import { genericIssError, generateUploadAccessKey } from '../../utils';

const accessTokenRouter = express.Router();

let sql: NeonQueryFunction<false, false> | null = null;
try {
    sql = neon(process?.env?.DATABASE_URL ?? '');
} catch (error) {
    console.error('Error connecting to database.');
    console.error(error);
}

accessTokenRouter.get('/generate', authenticateJwtToken, async (req: Request, res: Response) => {
    if (sql === null) {
        return res.status(500).json({
            error: {
                message: 'Error establishing database connection.',
            },
        });
    }
    const userObj = res.locals?.user;
    const userSchema = z.object({
        email: z.string(),
        iat: z.number(),
        exp: z.number(),
    });
    const validateUser = userSchema.safeParse(userObj);
    if (validateUser.success) {
        const user = validateUser.data;
        const uploadAccessKey = generateUploadAccessKey(16);
        try {
            await sql`UPDATE users
        SET access_key = ${uploadAccessKey}
        WHERE email = ${user.email};`;
            return res.status(200).json({
                accessKey: uploadAccessKey,
                email: user.email,
            });
        } catch (error) {
            console.error(error);
            return genericIssError(req, res);
        }
    }
    return res.status(500).json({
        error: {
            message: 'Internal server error in validation req.locals.',
        },
    });
});

export default accessTokenRouter;
