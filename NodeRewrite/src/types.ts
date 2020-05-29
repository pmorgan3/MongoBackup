export interface MongoBackupType {
  Database: string;
  MongoHost: string;
  MongoPort: string;
  MongoUser: string;
  MongoPass: string;
  MinioEndpoint: string;
  MinioAccessKey: string;
  MinioSecretKey: string;
  UseSSL: boolean;
  ZipName?: string;
  MinioRootPath?: string;
  MinioBucket: string;
  MinioSSL: boolean;
  MinioPort?: number;
}
