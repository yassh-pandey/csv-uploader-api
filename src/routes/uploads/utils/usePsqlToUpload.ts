import { spawn } from 'child_process';
import path from 'path';

function usePsqlToUpload(email: string, file_name: string): Promise<void> {
    const tableName = `${email}_${file_name}`;
    const csvFilePath = path.resolve(__dirname, '..', '..', '..', '..', 'files', `${email}`, `${file_name}`);
    const connectionString = process?.env?.DATABASE_URL ?? '';
    return new Promise((resolve, reject) => {
        // Spawn the psql command with appropriate arguments
        const psql = spawn('psql', [
            connectionString, // Use the provided connection string
            '-c',
            `\\COPY "${tableName}" FROM '${csvFilePath}' DELIMITER ',' CSV HEADER;`, // Construct the COPY command
        ]);

        // Handle stdout data
        psql.stdout.on('data', (data: any) => {
            console.log(`psql stdout: ${data}`);
        });

        // Handle stderr data
        psql.stderr.on('data', (data: any) => {
            console.error(`psql stderr: ${data}`);
        });

        // Handle psql process exit
        psql.on('close', (code: number) => {
            if (code === 0) {
                console.log('Data copied successfully.');
                resolve();
            } else {
                console.error(`psql process exited with code ${code}`);
                reject(new Error(`psql process exited with code ${code}`));
            }
        });
    });
}

export default usePsqlToUpload;
