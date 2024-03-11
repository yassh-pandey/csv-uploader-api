import { z } from 'zod';

const validateIfErrorHasMessage = function (error: unknown): boolean {
    const validationResult = errorSchema.safeParse(error);
    if (validationResult.success) {
        return true;
    } else {
        return false;
    }
};

const errorSchema = z.object({
    message: z.string(),
});

type WithMessage = z.infer<typeof errorSchema>;

export default validateIfErrorHasMessage;
export { type WithMessage };
