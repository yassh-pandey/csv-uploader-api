import { IncomingMessage } from 'http';
import type { WithMetaData } from '../types';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { z } from 'zod';

let sql: NeonQueryFunction<false, false> | null = null;

try {
    sql = neon(process?.env?.DATABASE_URL ?? '');
} catch (error) {
    console.error('Error establishing databse connection.');
    console.error(error);
}

async function namingFunction(req: IncomingMessage, meta_data?: Record<string, string | null>) {
    if (sql === null) {
        throw {
            status_code: 500,
            body: 'Error establishing database connection',
            source: 'namingFunction',
        };
    }
    const metaData = meta_data as WithMetaData;
    try {
        const results = await sql`SELECT email FROM users WHERE access_key=${metaData?.access_key};`;
        const emailSchema = z.object({
            email: z.string(),
        });
        const queryResultSchema = z.array(emailSchema).min(1);
        const queryValidateResults = queryResultSchema.safeParse(results);
        if (queryValidateResults.success) {
            const email = queryValidateResults?.data[0]?.email;
            const folder = email;
            const fileName = metaData.file_name;
            if (meta_data) {
                meta_data['email'] = email;
            }
            return `${folder}/${fileName}`;
        } else {
            throw {
                status_code: 401,
                body: 'Invalid access_key',
                source: 'namingFunction',
            };
        }
    } catch (error) {
        console.error(error);
        if (typeof error === 'object' && error !== null && 'source' in error && error?.source === 'namingFunction') {
            throw error;
        } else {
            throw {
                status_code: 500,
                body: 'Some unexpected error happened while validation access_code.',
            };
        }
    }
}

export default namingFunction;
