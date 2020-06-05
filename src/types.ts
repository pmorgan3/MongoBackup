export interface MongoBackupConfig {
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
