# MongoBackupMinio
MongoBackupMinio is a nodejs package that allows you to backup Mongo databases to min.io.

## Installation
[Make sure you have Mongodb tool installed on your computer](https://docs.mongodb.com/manual/installation/)

Then run
```bash
npm i mongobackupminio
```

## Usage

```typescript
import * from 'mongobackupminio'

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

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)