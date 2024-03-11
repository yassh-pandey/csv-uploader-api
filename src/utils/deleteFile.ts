import { promises as fsPromises } from 'fs';

async function deleteFile(filePath: string) {
    try {
        await fsPromises.unlink(filePath);
    } catch (err) {
        console.error('Error deleting file:', err);
    }
}
export default deleteFile;
