import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;
try {
    sql = neon(process?.env?.DATABASE_URL ?? '');
} catch (error) {
    console.error('Error connecting to database.');
    console.error(error);
}

const authenticateFileAccessForUser = async function (req: Request, res: Response, next: NextFunction) {
    if (sql === null) {
        return res.status(500).json({
            error: {
                message: 'Error establishing database connection.',
            },
        });
    }
    const reqBody = req.body;
    const bodySchema = z.object({
        from: z.string({
            required_error: `'from' is required in request body.`,
            invalid_type_error: `'from' should be of type string.`,
        }),
        access_key: z.string({
            invalid_type_error: `'access_key' should be of type string.`,
            required_error: `'access_key' is required in request body.`,
        }),
    });
    const validateReqBody = bodySchema.safeParse(reqBody);
    if (validateReqBody.success) {
        const access_key = validateReqBody.data.access_key;
        const file_name = validateReqBody.data.from;
        const email_results = await sql`SELECT email FROM users WHERE access_key=${access_key};`;
        const emailSchema = z.object({
            email: z.string(),
        });
        const email_results_schema = z.array(emailSchema).min(1);
        const validateEmailResults = email_results_schema.safeParse(email_results);
        if (validateEmailResults?.success) {
            const email = validateEmailResults?.data[0]?.email;
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
                if (exists === true) {
                    res.locals.email = email;
                    res.locals.access_key = access_key;
                    res.locals.file_name = file_name;
                    next();
                } else {
                    return res.status(404).json({
                        error: {
                            message: `File: ${file_name} does not exist for you.`,
                        },
                    });
                }
            } else {
                return res.status(500).json({
                    error: {
                        message: 'Some unexpected error happened in validating exists result schema.',
                    },
                });
            }
        } else {
            return res.status(401).json({
                error: {
                    message: 'Invalid access_code.',
                },
            });
        }
    } else {
        return res.status(400).json({
            error: {
                message: validateReqBody.error.issues[0].message,
            },
        });
    }
};

export default authenticateFileAccessForUser;
