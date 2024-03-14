import express, { Request, Response } from 'express';
import { z } from 'zod';
import { Client } from '@neondatabase/serverless';
import { authenticateFileAccessForUser, WithUserData } from '../../middlewares';

const queryRouter = express.Router();

queryRouter.post('/', authenticateFileAccessForUser, async (req: Request, res: Response) => {
    const reqBody = req.body;
    const bodySchema = z.object({
        select: z.array(
            z.string({
                invalid_type_error: `Values in 'select' array should be of type string.`,
            }),
            {
                required_error: `'select' array is required in request body.`,
                invalid_type_error: `'select' should be of type array of string.`,
            }
        ),
        where: z
            .array(
                z.record(
                    z.array(
                        z.string({
                            invalid_type_error: `'where' should be of type object where keys are string and values are array of string.`,
                        }),
                        {
                            invalid_type_error: `'where' should be of type object where keys are string and values are array of string.`,
                        }
                    ),
                    {
                        invalid_type_error: `'where' should be of type object where keys are string and values are array of string.`,
                    }
                ),
                {
                    invalid_type_error: `'where' should be of type object where keys are string and values are array of string.`,
                }
            )
            .optional(),
        limit: z
            .number({
                invalid_type_error: `'limit' should be of type number.`,
            })
            .optional(),
        offset: z
            .number({
                invalid_type_error: `'offset' should be of type number (0 index based).`,
            })
            .optional(),
    });
    const validateReqBody = bodySchema.safeParse(reqBody);
    if (!validateReqBody.success) {
        const error = validateReqBody.error;
        return res.status(400).json({
            error: {
                messages: error.issues.map((issue) => issue.message),
            },
        });
    }

    const body = validateReqBody.data;

    let client: Client | null = null;

    try {
        client = new Client(process?.env?.DATABASE_URL ?? '');

        await client.connect();

        const reqWithUserData = res as WithUserData;

        const email = reqWithUserData.locals.email;
        const file_name = reqWithUserData.locals.file_name;

        let selectPartialQuery = body.select.map((s) => `"${s}"`).join(',');
        if (selectPartialQuery === `"*"`) {
            selectPartialQuery = `*`;
        }
        const fromPartialQuery = `"${email}_${file_name}"`;

        // Complex query building happening here
        // Maybe refactor to make more readable
        const orConditions = body?.where?.map((condition) => {
            let andElements = [];
            for (const [key, values] of Object.entries(condition ?? {})) {
                let inElements = values
                    .map((value) => {
                        return `"${key}" = '${value}'`;
                    })
                    .join(' OR ');
                inElements = `( ${inElements} )`;
                andElements.push(inElements);
            }
            let andPartialQuery = andElements.join(' AND ');
            andPartialQuery = `( ${andPartialQuery} )`;
            return andPartialQuery;
        });
        let wherePartialQuery = orConditions?.join(' OR ');

        let limit: number | null = null;
        if (body?.limit !== undefined) {
            limit = body?.limit;
        }

        let offset: number | null = null;
        if (body?.offset !== undefined) {
            offset = body?.offset;
        }

        let finalSearchQuery = `SELECT ${selectPartialQuery} FROM ${fromPartialQuery}`;
        if (wherePartialQuery !== undefined && wherePartialQuery?.length > 0) {
            finalSearchQuery += ` WHERE ${wherePartialQuery}`;
        }
        if (limit !== null) {
            finalSearchQuery += ` LIMIT ${limit}`;
        }

        if (offset !== null) {
            finalSearchQuery += ` OFFSET ${offset}`;
        }

        finalSearchQuery += `;`;

        interface QueryResult {
            rows: Array<Record<string, string>>;
            fields: Array<Record<'name', string>>;
        }

        const result: QueryResult = await client.query(finalSearchQuery);
        const data: Record<string, Array<string>> = {};
        result.fields.forEach((field) => {
            let fieldName = field.name;
            data[fieldName] = result.rows.map((row) => row[`${fieldName}`]);
        });
        return res.json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: {
                message: 'Some unexpected error happened while running the search query.',
            },
        });
    } finally {
        if (client !== null) {
            // Close the database connection
            await client.end();
        }
    }
});

export default queryRouter;
