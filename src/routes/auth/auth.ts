import express, { Request, Response } from 'express';
import { z } from 'zod';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { validateForEmailAndPassword, genericIssError, generateJwtToken } from '../../utils';
import { hash, compare } from 'bcrypt';
import type { WithEmailPassword } from '../../utils';

const authRouter = express.Router();

let sql: NeonQueryFunction<false, false> | null = null;

try {
    sql = neon(process?.env?.DATABASE_URL ?? '');
} catch (error) {
    console.error('Error connecting to database.');
    console.error(error);
}

authRouter.post('/sign-up', async (req: Request, res: Response) => {
    if (sql === null) {
        return res.status(500).json({
            error: {
                message: 'Error establishing database connection.',
            },
        });
    }
    await validateForEmailAndPassword(req, res);
    if (res.headersSent) {
        return;
    }
    const reqBody: WithEmailPassword = req.body;
    const { email, password } = reqBody;
    const hashedPassword = await hash(password, 10);
    try {
        await sql`INSERT INTO users (email, password, access_key) 
    VALUES (${email}, ${hashedPassword}, '');`;
        const jwt = generateJwtToken(email);
        return res.status(201).json({
            msg: `Successfully signed up user with the email address: ${email}`,
            jwt,
        });
    } catch (error) {
        console.error(error);
        const errorSchema = z.object({
            code: z.string(),
        });
        const errorValidation = errorSchema.safeParse(error);
        if (errorValidation.success) {
            if (errorValidation.data.code === '23505') {
                return res.status(400).json({
                    error: {
                        message: 'A user with this email id already exists. Please use another email id.',
                    },
                });
            } else {
                return genericIssError(req, res);
            }
        } else {
            return genericIssError(req, res);
        }
    }
});

authRouter.post('/login', async (req: Request, res: Response) => {
    if (sql === null) {
        return res.status(500).json({
            error: {
                message: 'Error establishing database connection.',
            },
        });
    }
    await validateForEmailAndPassword(req, res);
    if (res.headersSent) {
        return;
    }
    const reqBody: WithEmailPassword = req.body;
    const { email, password } = reqBody;
    try {
        const results = await sql`SELECT email, password FROM users WHERE email=${email}`;
        if (results.length > 0) {
            const { password: hashedPassword } = results[0] as WithEmailPassword;
            const passwordMatches = await compare(password, hashedPassword);
            if (passwordMatches) {
                const jwt = generateJwtToken(email);
                return res.status(200).json({
                    msg: `Successfully logged in with email addres: ${email}`,
                    jwt,
                });
            } else {
                return res.status(401).json({
                    error: {
                        message: 'The email id or password that you have entered is incorrect.',
                    },
                });
            }
        } else {
            return res.status(401).json({
                error: {
                    message: 'The email id or password that you have entered is incorrect.',
                },
            });
        }
    } catch (error) {
        console.error(error);
        return genericIssError(req, res);
    }
});

export default authRouter;
