# MongoBackupMinio
MongoBackupMinio is a nodejs package that allows you to backup Mongo databases to min.io.

## Installation
[Make sure you have Mongodb tool installed on your computer](https://docs.mongodb.com/manual/installation/)

Then run
```bash
npm i mongo-backup-minio
```

## Usage

```typescript
import * from 'mongo-backup-minio'

const config: MongoBackupConfig = {
  Database: string;
  MongoHost: string;
  MongoPort: string;
  MongoUser: string;
  MongoPass: string;
  MinioEndpoint: string;
  MinioAccessKey: string;
  MinioSecretKey: string;
  MongoSSL: boolean;
  ZipName?: string;
  MinioRootPath?: string;
  MinioBucket: string;
  MinioSSL: boolean;
  MinioPort?: number;
  WebhookURL: string;
}

const backup = new MongoBackup(config)
backup.createBackup()
backup.uploadBackup()
```

## CLI usage
To use this as a CLI tool, install the package globally.

Then run `npx mongo-backup-minio` with the following options:

```
--host              Connection String for Mongodb
--database          The name of the database
--mongo-port        The database port
--mongo-user        The usernamse associated with the database
--mongo-pass        The password used for the mongodb
--minio-endpoint    The endpoint used to connect to your minio instance
--accesskey         Your Minio access key
--secretkey         Your Minio secret key
--mongo-ssl         Determines whether to connect to the mongo db using ssl
--root-path         The path in your minio instance where the uploaded backup is stored
--minio-bucket      The name of the bucket 
--minio-ssl         Determines if the connection to minio will be via ssl 
--minio-port        The port used to connect to your Minio instance 
--slack-hook        The webhook used with slack integration
```

So an example use would be `npx mongo-backup-minio --host=<database-host> --database=<database-name> --mongo-port=27017 --mongo-user=user --mongo-pass=password --minio-endpoint=min.io --accesskey=access --secretkey=secret --mongo-ssl=true --minio-bucket=bucket --minio-port=4000`

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
