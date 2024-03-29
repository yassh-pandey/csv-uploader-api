import { Client } from '@neondatabase/serverless';
import fs from 'fs';
import { from } from 'pg-copy-streams';
import path from 'path';

async function uploadCsvDataToTable(email: string, file_name: string) {
    const tableName = `${email}_${file_name}`;
    const csvFilePath = path.resolve(__dirname, '..', '..', '..', '..', 'files', `${email}`, `${file_name}`);

    let client: Client | null = null;

    try {
        client = new Client(process?.env?.DATABASE_URL ?? '');

        await client.connect();

        // Begin the transaction
        await client.query('BEGIN');

        // Create a writable stream to the target table
        const stream = client.query(from(`COPY "${tableName}" FROM STDIN CSV HEADER`));

        // Create a readable stream from the local CSV file
        const fileStream = fs.createReadStream(csvFilePath);

        // Pipe the data from the CSV file to the PostgreSQL table
        fileStream.pipe(stream);

        // Wait for the stream to finish
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        // Commit the transaction
        await client.query('COMMIT');
    } catch (error) {
        console.error('Error uploading CSV data:', error);
        if (client === null) {
            throw {
                error,
                source: 'uploadCsvDataToTables',
                message: 'Error initializaing the database connection object.',
            };
        }
        // Commit the transaction
        await client.query('ROLLBACK');
        throw {
            error,
            source: 'uploadCsvDataToTables',
            message: 'Error in uploading csv data to the table.',
        };
    } finally {
        if (client !== null) {
            // Close the database connection
            await client.end();
        }
    }
}

export default uploadCsvDataToTable;
