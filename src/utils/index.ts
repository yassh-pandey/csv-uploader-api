import validateForEmailAndPassword from './validateForEmailAndPassword';
import type { WithEmailPassword } from './validateForEmailAndPassword';
import validateIfErrorHasMessage from './validateIfErrorHasMessage';
import type { WithMessage } from './validateIfErrorHasMessage';
import genericIssError from './genericIssError';
import generateJwtToken from './generateJwtToken';
import verifyJwtToken from './verifyJwtToken';
import generateUploadAccessKey from './generateUploadAccessKey';
import deleteFile from './deleteFile';
import createNewTable from '../routes/uploads/utils/createNewTable';

export {
    validateForEmailAndPassword,
    genericIssError,
    generateJwtToken,
    verifyJwtToken,
    validateIfErrorHasMessage,
    generateUploadAccessKey,
    deleteFile,
    createNewTable,
};
export type { WithEmailPassword, WithMessage };
