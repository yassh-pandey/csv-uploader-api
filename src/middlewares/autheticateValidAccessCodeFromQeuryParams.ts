import { NeonQueryFunction } from '@neondatabase/serverless';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const authenticateValidAccessCodeFromQueryParams = function (sql: NeonQueryFunction<false, false>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const queryParamsSchema = z.object({
            access_key: z.string(),
            file_name: z.string(),
        });
        const req_query = req.query;
        const validationResult = queryParamsSchema.safeParse(req_query);
        if (validationResult?.success) {
            const access_key = validationResult?.data?.access_key;
            const file_name = validationResult?.data?.file_name;
            try {
                const email_results = await sql`SELECT email FROM users WHERE access_key=${access_key};`;
                const emailSchema = z.object({
                    email: z.string(),
                });
                const email_results_schema = z.array(emailSchema).min(1);
                const validateEmailResults = email_results_schema.safeParse(email_results);
                if (validateEmailResults?.success) {
                    const email = validateEmailResults?.data[0]?.email;
                    res.locals.email = email;
                    res.locals.access_key = access_key;
                    res.locals.file_name = file_name;
                    next();
                } else {
                    return res.status(401).json({
                        error: {
                            message: 'Invalid access_code.',
                        },
                    });
                }
            } catch (error) {
                return res.status(500).json({
                    error: {
                        message: 'Some unexpected error happed while fetching user info.',
                    },
                });
            }
        } else {
            return res.status(400).json({
                error: {
                    message: 'Some or all of the mandatory query params: access_key & file_name are missing.',
                },
            });
        }
    };
};

interface WithUserData extends Response {
    locals: {
        email: string;
        file_name: string;
        access_key: string;
    };
}

export default authenticateValidAccessCodeFromQueryParams;

export { WithUserData };
