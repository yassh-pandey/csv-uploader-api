import { z } from 'zod';
import { Request, Response } from 'express';

const PASSWORD_VALIDATION_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])[A-Za-z\d !"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]{8,}$/;

const emailPasswordSchema = z.object({
    email: z
        .string({
            required_error: 'Required filed email is missing.',
            invalid_type_error: 'Email has to be of type string.',
        })
        .email('Please provide a valid email field.'),
    password: z
        .string({
            required_error: 'Required filed password is missing.',
            invalid_type_error: 'Password has to be of type string.',
        })
        .max(50, 'Password should not be greater than 50 characters in length.')
        .regex(
            PASSWORD_VALIDATION_REGEX,
            `Password should be minimum eight characters and should contain at least one uppercase letter, one lowercase letter, one number and one special character. Allowed special characters are \/\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~\/`
        ),
});

const validateForEmailAndPassword = async function (req: Request, res: Response) {
    const requestBody = req.body;
    const validationResult = emailPasswordSchema.safeParse(requestBody);
    if (validationResult?.success) {
        const email = validationResult?.data?.email;
        const password = validationResult?.data?.password;
        return {
            email,
            password,
        };
    } else {
        const errors = validationResult?.error;
        const errorMessages = errors.issues?.map((issue) => issue.message);
        return res.status(400).json({
            error: {
                messages: errorMessages,
            },
        });
    }
};

type WithEmailPassword = z.infer<typeof emailPasswordSchema>;

export { type WithEmailPassword };

export default validateForEmailAndPassword;
