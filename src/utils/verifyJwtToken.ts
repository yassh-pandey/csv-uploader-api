import { verify } from 'jsonwebtoken';
import { validateIfErrorHasMessage } from './index';
import type { WithMessage } from './index';

function verifyAccessToken(token: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Please set JWT_SECRET environment variable.');
    }

    try {
        const decoded = verify(token, secret);
        return { success: true, data: decoded };
    } catch (error) {
        const hasMessage = validateIfErrorHasMessage(error);
        if (hasMessage) {
            return {
                success: false,
                error: {
                    message: (error as WithMessage).message,
                },
            };
        } else {
            return {
                success: false,
                error: {
                    message: 'Some unexpected error happened during token verification.',
                },
            };
        }
    }
}

export default verifyAccessToken;
