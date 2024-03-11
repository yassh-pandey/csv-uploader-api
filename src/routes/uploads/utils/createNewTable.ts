import { Client } from '@neondatabase/serverless';

const createNewTable = async function (
    email: string,
    file_name: string,
    columns: Array<string>,
    replace_existing: string
) {
    const tableName = `${email}_${file_name}`;

    const client = new Client(process?.env?.DATABASE_URL ?? '');
    const partialQuery = columns.map((column) => `"${column}" TEXT`).join(', ');
    try {
        await client.connect();

        // Begin the transaction
        await client.query('BEGIN');

        if (replace_existing === 'true') {
            const dropExistingTableQuery = `DROP TABLE IF EXISTS "${tableName}";`;
            await client.query(dropExistingTableQuery);

            const removeUploadedFilesEntry = `DELETE from uploaded_files WHERE email='${email}' AND file_name='${file_name}';`;
            await client.query(removeUploadedFilesEntry);
        }

        // Construct the CREATE TABLE query dynamically
        const createTableQuery = `CREATE TABLE IF NOT EXISTS "${tableName}" (${partialQuery});`;

        // Execute the CREATE TABLE query
        await client.query(createTableQuery);

        const updateMappingDb = `INSERT INTO uploaded_files (file_name, email) VALUES ('${file_name}', '${email}');`;

        // Execute the Insert into uploaded_files query
        await client.query(updateMappingDb);

        // Commit the transaction if all statements succeed
        await client.query('COMMIT');
    } catch (error) {
        // Rollback the transaction if any error occurs
        await client.query('ROLLBACK');
        throw {
            error,
            source: 'createNewTable',
            message: 'Error in transaction when creating new table. Rolling back.',
        };
    } finally {
        await client.end();
    }
};

export default createNewTable;
