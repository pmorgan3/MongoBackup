"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backup = void 0;
exports.Backup = {
    Database: process.env.DATABASE,
    MongoHost: process.env.MONGO_HOST,
    MongoPort: process.env.MONGO_PORT,
    MongoUser: process.env.MONGO_USER,
    MongoPass: process.env.MONGO_PASSWORD,
    MinioEndpoint: process.env.MINIO_ENDPOINT,
    MinioAccessKey: process.env.MINIO_ACCESS,
    MinioSecretKey: process.env.MINIO_SECRET,
    MinioBucket: process.env.MINIO_BUCKET,
    MinioPort: +process.env.MINIO_PORT,
    ZipName: process.env.ZIP_NAME,
    MinioRootPath: process.env.MINIO_ROOT_PATH,
    MongoSSL: process.env.MONGO_SSL === 'true',
    MinioSSL: process.env.MINIO_SSL === 'true',
    WebhookURL: process.env.SLACK_WEBHOOK_URL
};
