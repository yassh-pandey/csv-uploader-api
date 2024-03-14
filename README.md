# CSV Uploader API

A simple express backend which uses TUS protocol to upload CSV files to a remote file storage and then upload it into neon postgres database.

## Installation

Clone this repo. `cd` into it and run `npm install`.

Create an account with [Neon DB](https://neon.tech/) to serverlessly manage your postgres database.
Don't worry, as of March 2024 they offer a generous free tier.

Create a `.env` file into the project root with atleast these environment variables:

```
// your localhost port to run the server on
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

    HTTP Verb: `GET`

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

    HTTP Verb: `POST`

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

    HTTP Verb: `POST`

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

    HTTP Verb: `GET`

    Authorization Header:

    ```
    Bearer your.jwt.token
    ```

    Response:

    ```json
    {
        "access_key": "some_access_key",
        "email": "yash@sample.com"
    }
    ```

-   File Exists endpoint

    Request:

    ```curl
    http://localhost:3000/file-exists
    ```

    HTTP Verb: `GET`

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

-   File Upload endpoint

    Follows the [TUS protocol](https://tus.io/protocols/resumable-upload) for resumable file uploads to the native file system.

    Request:

    ```curl
    http://localhost:3000/uploads
    ```

    HTTP Verv: `POST`

    Request Header:

    ```ts
    {
        "Upload-Metadata": {
            "file_name": string,
            "file_type": string,
            "access_key": string,
            "replace_existing": String(true | false),
            "columns": String(Array<string>),
        }
    }
    ```

-   Query Uploaded Files endpoint

    This endpoint needs some explanation. So instead of allowing users to send
    explicit SQL queries as string, we let them pass their queries as a JSON object.
    This object is processed in the API to construct an actual SQL query.
    The primary reason for doing so is to have a consistent API design and to prevent security risks like SQL injection attacks.

    The query object will be of the following shape:

    ```ts
    {
        "access_key": string,
        "select": Array<string>,
        "from": string,
        "limit"?: number,
        "offset"?: number,
        "where"?: Array<Record<string, Array<string>>>
    }
    ```

    Right now we don't support joins and other complex nested queries. But feel free to create a PR to support that.

    Now most of these fields mean what they mean in a normal SQL query with a few small caveats.
    The `where` clause! It's best to explain with an example. A query object like this:

    ```json
    {
        "access_key": "your_access_key",
        "select": ["*"],
        "from": "normal.csv",
        "limit": 20,
        "offset": 10,
        "where": [
            {
                "CONTENT TYPE": ["SIG Newsletters", "Journals"],
                "ISSN": ["1558-2337"]
            },
            {
                "ABBR": ["SIGBIO Newsl."]
            }
        ]
    }
    ```

    Will get compiled into an `SQL` query similar to something like this:

    ```SQL
    SELECT * FROM "table_name_internal_implementation"
    WHERE (("CONTENT TYPE" = 'SIG Newsletters' OR "CONTENT TYPE" = 'Journals') AND ("ISSN" = '1558-2337'))
    OR
    ("ABBR" = 'SIGBIO Newsl.')
    LIMIT 20 OFFSET 10;
    ```

    So all the objects inside the where clause are connected using the `OR` keyword. Similarly whenever any key has a value of `Array<string>` each `key = value` is also connected using the `OR` keyword.
    Finally, different properties in the object are connected using the `AND` keyword.

    I hope this explains how you'll be able to construct your own queries.

    Request:

    ```curl
    http://localhost:3000/query
    ```

    HTTP Verb: `POST`

    Query Params:

    ```json
    {
        "access_key": "your_access_key",
        "select": ["*"],
        "from": "normal.csv",
        "limit": 20,
        "where": [
            {
                "CONTENT TYPE": ["SIG Newsletters", "Journals"],
                "ISSN": ["1558-2337"]
            },
            {
                "ABBR": ["SIGBIO Newsl."]
            }
        ]
    }
    ```

    Response:

    ```json
    {
        "CONTENT TYPE": ["SIG Newsletters", "SIG Newsletters"],
        "TITLE": ["ACM SIGACCESS Accessibility and Computing", "ACM SIGBIO Newsletter"],
        "ABBR": ["SIGACCESS Access. Comput.", "SIGBIO Newsl."],
        "ISSN": ["1558-2337", "0163-5697"],
        "e-ISSN": ["1558-1187", ""],
        "PUBLICATION RANGE: START": ["Issue 77-78 (Sept. 2003 - Jan. 2004)", "Volume 1 Issue 2 (October 1976)"],
        "PUBLICATION RANGE: LATEST PUBLISHED": ["Issue 107 (September 2013)", "Volume 21 Issue 1 (April 2001)"],
        "SHORTCUT URL": ["http://dl.acm.org/citation.cfm?id=J956", "http://dl.acm.org/citation.cfm?id=J698"],
        "ARCHIVE URL": [
            "http://dl.acm.org/citation.cfm?id=J956&picked=prox",
            "http://dl.acm.org/citation.cfm?id=J698&picked=prox"
        ]
    }
    ```

## Basic Flow

User signs up to the console application (you'll have to implement this on your own) using their email id and password. Once the user is successfully signed up, the server sends a json web token which the client can store appropriately.

User can use the console application to generate an access token which they can use with the [front end sdk library](https://github.com/yassh-pandey/react-csv-upload).

The key thing is that we need to make sure that files are stored seperately for each user. So that when they are querying them later on then a user has access to only those files which they had uploaded. We use the access_key to achieve that.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

CSV Uploader API is [fair-code](https://faircode.io/) distributed under distributed under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt) with [Commons Clause](https://commonsclause.com/) license.

[Please click here to check the complete license.](LICENSE.md)
