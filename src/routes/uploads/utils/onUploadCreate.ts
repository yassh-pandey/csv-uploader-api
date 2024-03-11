import { IncomingMessage, ServerResponse } from 'http';
import { Upload } from '@tus/server';
import { metaDataSchema } from '../types';

async function onUploadCreate(req: IncomingMessage, res: ServerResponse, upload: Upload) {
    const metaData = upload?.metadata;
    const metaDataValidation = metaDataSchema.safeParse(metaData);
    if (metaDataValidation.success) {
        const { file_type } = metaDataValidation?.data;
        if (file_type !== 'text/csv') {
            throw {
                status_code: 400,
                body: JSON.stringify({
                    error: {
                        message: 'Invalid file type. Only CSV files are allowed.',
                    },
                }),
            };
        } else {
            return res;
        }
    } else {
        const message = `Expect fileName, fileType, access_key, replace_existing and columns in "Upload-Metadata" header`;
        throw {
            status_code: 500,
            body: JSON.stringify({
                error: {
                    message,
                },
            }),
        };
    }
}

export default onUploadCreate;
