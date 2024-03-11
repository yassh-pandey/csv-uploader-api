import { sign } from 'jsonwebtoken';

function generateAccessToken(email: string) {
    const payload = {
        email,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Please set JWT_SECRET environment variable.');
    }
    const options = { expiresIn: '1h' };

    return sign(payload, secret, options);
}

export default generateAccessToken;
