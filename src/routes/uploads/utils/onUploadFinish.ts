import { IncomingMessage, ServerResponse } from 'http';
import { Upload } from '@tus/server';
import type { WithMetaData } from '../types';
import { uploadCsvDataToTable, usePsqlToUpload } from '.';
import { deleteFile, createNewTable } from '../../../utils';
import path from 'path';

async function onUploadFinish(
    req: IncomingMessage,
    res: ServerResponse,
    upload: Upload
): Promise<ServerResponse<IncomingMessage>> {
    const email = upload?.metadata?.email;
    const metaData = upload.metadata as WithMetaData;
    const fileName = metaData?.file_name;
    const replaceExisting = metaData?.replace_existing;
    if (email && typeof email === 'string') {
        const pathToJsonMetadataFile = path.resolve(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            'files',
            `${email}`,
            `${fileName}.json`
        );
        await deleteFile(pathToJsonMetadataFile);
        try {
            const table_columns = JSON.parse(metaData?.columns) as Array<string>;
            await createNewTable(email, fileName, table_columns, replaceExisting);
            if (process?.env?.USE_PSQL_TO_UPLOAD === 'true') {
                await usePsqlToUpload(email, fileName);
            } else {
                await uploadCsvDataToTable(email, fileName);
            }
        } catch (error) {
            console.error(error);
            let message = '';
            if (
                typeof error === 'object' &&
                error !== null &&
                'source' in error &&
                (error?.source === 'createNewTable' || error?.source === 'uploadCsvDataToTables') &&
                'message' in error &&
                typeof error?.message === 'string'
            ) {
                message = error?.message;
            } else {
                message = 'Cannot parse columns field from metadata.';
            }
            throw {
                stauts_code: 400,
                body: JSON.stringify({
                    error: {
                        message,
                    },
                }),
            };
        }
        return res;
    } else {
        return res;
    }
}

export default onUploadFinish;
