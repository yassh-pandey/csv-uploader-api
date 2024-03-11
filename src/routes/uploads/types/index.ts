import { z } from 'zod';

const metaDataSchema = z.object({
    file_name: z.string(),
    file_type: z.string(),
    access_key: z.string(),
    replace_existing: z.string().refine((value) => value === 'true' || value === 'false'),
    columns: z.string(),
});
type WithMetaData = z.infer<typeof metaDataSchema>;

export { metaDataSchema };
export type { WithMetaData };
