import { Client } from '@neondatabase/serverless';
import fs from 'fs';
import { from } from 'pg-copy-streams';
import path from 'path';

async function uploadCsvDataToTable(email: string, file_name: string) {
    const tableName = `${email}_${file_name}`;
    const csvFilePath = path.resolve(__dirname, '..', '..', '..', '..', 'files', `${email}`, `${file_name}`);

    const client = new Client(process?.env?.DATABASE_URL ?? '');
    try {
        await client.connect();

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
    } catch (error) {
        console.error('Error uploading CSV data:', error);
        throw {
            error,
            source: 'uploadCsvDataToTables',
            message: 'Error in uploading csv data to the table.',
        };
    } finally {
        // Close the database connection
        await client.end();
    }
}

export default uploadCsvDataToTable;
