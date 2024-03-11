import { randomBytes } from 'crypto';

function generateUploadAccessKey(length: number): string {
    // Generate a random buffer
    const buffer = randomBytes(length);
    // Convert the buffer to a hexadecimal string
    const accessKey = buffer.toString('hex');
    return accessKey;
}
export default generateUploadAccessKey;
