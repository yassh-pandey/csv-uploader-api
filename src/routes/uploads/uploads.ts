import express from 'express';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { onUploadFinish, onUploadCreate, namingFunction } from './utils';
import { preventFileAccessViaUploadUrl } from '../../middlewares';

const uploadPath = '/uploads';

const uploadsRouter = express.Router();

const uploadServer = new Server({
    path: uploadPath,
    datastore: new FileStore({ directory: './files' }),
    maxSize: 1024 * 1024 * 1024, // 1 GB
    onUploadCreate: onUploadCreate,
    onUploadFinish: onUploadFinish,
    namingFunction: namingFunction,
    generateUrl(req, { proto, host, path, id }) {
        id = Buffer.from(id, 'utf-8').toString('base64url');
        return `${proto}://${host}${path}/${id}`;
    },
    getFileIdFromRequest(req) {
        const reExtractFileID = /([^/]+)\/?$/;
        const match = reExtractFileID.exec(req.url as string);

        if (!match || uploadPath.includes(match[1])) {
            return;
        }

        return Buffer.from(match[1], 'base64url').toString('utf-8');
    },
});

uploadsRouter.use(preventFileAccessViaUploadUrl);

uploadsRouter.all('*', uploadServer.handle.bind(uploadServer));

export default uploadsRouter;
