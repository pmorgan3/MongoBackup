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

Then run `npx mongo-backup-minio` to see the list of required arguments


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
