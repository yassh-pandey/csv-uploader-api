# CSV Uploader API

A simple express backend which uses TUS protocol to upload CSV files to a remote file storage and then upload it into neon postgres database.

## Installation

Clone this repo. `cd` into it and run `npm install`.

Create an account with [Neon DB](https://neon.tech/) to serverlessly manage your postgres database. Don't worry, as of writing this README they have generous free tier.

Create a `.env` file into the project root with atleast these environment variables:

```
// your_localhost_port_to_run_the_server_on
PORT

// your neon db database connection string
DATABASE_URL

// Your JSON Web Token secret
JWT_SECRET

// Set this to true if you want to use the PSQL to upload your files
USE_PSQL_TO_UPLOAD
```

Go to your [Neon DB's](https://neon.tech/) SQL Editor panel to create these two tables in the given order or use any other migration technique which you are more familiar with:

```sql
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY NOT NULL,
    password VARCHAR(255) NOT NULL,
    access_key TEXT NOT NULL
);
```

```sql
CREATE TABLE uploaded_files (
    file_id SERIAL PRIMARY KEY NOT NULL,
    email VARCHAR(255) REFERENCES Users(email) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

To start the dev server with nodemon run:

```bash
npm run dev
```

## Endpoints

-   Happy path endpoint

    Request:

    ```curl
    localhost:3000
    ```

    Response:

    ```text
    At least I am working :)
    ```

-   404 Routes

    Request:

    ```
    localhost:3000/name
    ```

    Response:

    ```json
    {
        "error": {
            "message": "Not found."
        }
    }
    ```

-   Signup endpoint

    Request:

    ```curl
    http://localhost:3000/auth/sign-up
    ```

    Body (JSON):

    ```json
    {
        "email": "yash@sample.com",
        "password": "sample_password"
    }
    ```

    Response:

    ```json
    {
        "msg": "Successfully signed up user with the email address: yash@sample.com",
        "jwt": "your.jwt.token"
    }
    ```

-   Login endpoint

    Request:

    ```curl
    http://localhost:3000/auth/login
    ```

    Body (JSON):

    ```json
    {
        "email": "yash@sample.com",
        "password": "sample_password"
    }
    ```

    Response:

    ```json
    {
        "msg": "Successfully logged in with email addres: yash@abc.com",
        "jwt": "your.jwt.token"
    }
    ```

-   Generate Access Token endpoint

    Request:

    ```curl
    http://localhost:3000/access-token/generate
    ```

    Authorization Header:

    ```
    Bearer your.jwt.token
    ```

    Response:

    ```json
    {
        "accessKey": "some_access_key",
        "email": "yash@sample.com"
    }
    ```

-   File exists endpoint

    Request:

    ```curl
    http://localhost:3000/file-exists/
    ```

    Query Params:

    ```
    access_key=your_access_key
    file_name=normal.csv
    ```

    Response:

    ```json
    {
        "file_name": "normal.csv",
        "exists": true
    }
    ```

## Basic Flow

User signs up to the console application (you'll have to implement this on your own) using their email id and password. Once the user is successfully signed up, the server sends a json web token which the client can store appropriately.

User can use the console application to generate an access token which they can use with the [front end sdk library](https://github.com/yassh-pandey/react-csv-upload).

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

React CSV Upload is [fair-code](https://faircode.io/) distributed under distributed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt) with [Commons Clause](https://commonsclause.com/) license.

[Please click here to check the complete license.](LICENSE.md)
