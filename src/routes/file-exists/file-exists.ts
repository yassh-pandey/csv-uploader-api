import express, { Request, Response } from 'express';
import { authenticateValidAccessCode, WithUserData } from '../../middlewares';
import { z } from 'zod';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const fileExistsRouter = express.Router();
let sql: NeonQueryFunction<false, false> | null = null;

try {
    sql = neon(process?.env?.DATABASE_URL ?? '');
} catch (error) {
    console.error('Error connecting to database.');
    console.error(error);
}
if (sql !== null) {
    fileExistsRouter.use(authenticateValidAccessCode(sql));
}

fileExistsRouter.get('/', async (req: Request, res: Response) => {
    if (sql === null) {
        return res.status(500).json({
            error: {
                message: 'Error establishing database connection.',
            },
        });
    }
    const response = res as WithUserData;
    const { email, access_key, file_name } = response.locals;
    try {
        const existsSchema = z.object({
            exists: z.boolean(),
        });
        const resultSchema = z.array(existsSchema).min(1);
        const results = await sql`SELECT EXISTS (
            SELECT 1 
            FROM uploaded_files 
            WHERE email = ${email}
            AND file_name = ${file_name}
        );`;
        const validate_exists_results = resultSchema.safeParse(results);
        if (validate_exists_results?.success) {
            const exists = validate_exists_results?.data[0]?.exists;
            return res.status(200).json({
                file_name,
                exists,
            });
        } else {
            return res.status(500).json({
                error: {
                    message: 'Some unexpected error happened in validating exists result schema.',
                },
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                message: 'Some unexpected error happened while fetching user info.',
            },
        });
    }
});

export default fileExistsRouter;
