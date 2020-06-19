import { MongoBackupConfig } from './types';
import winston from 'winston';
export declare class MongoBackup {
    Database: string;
    MongoHost: string;
    MongoPort?: string;
    MongoUser?: string;
    MongoPass?: string;
    MinioEndpoint: string;
    MinioSecretKey: string;
    MinioAccessKey: string;
    MinioBucket: string;
    MinioPort?: number;
    ZipName?: string;
    MinioRootPath?: string;
    MongoSSL: boolean;
    MinioSSL: boolean;
    WebhookURL?: string;
    Logger?: winston.Logger;
    OutputName: string;
    private unzipped;
    private minio_client;
    constructor(Backup?: MongoBackupConfig);
    private initMinio;
    createBackup(verbose?: boolean): void;
    uploadBackup(verbose?: boolean): void;
    cleanUp(verbose?: boolean): void;
    /**
     * set the name of the ENV variable corresponding to your DB name
     * @param db_var The name of your env variable corresponding to the name of your DB
     */
    setDatabaseVar(db_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your DB host
     * @param host_var The name of your env variable corresponding to your DB host
     */
    setMongoHostVar(host_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your DB port
     * @param port_var The name of your env variable corresponding to the port of your DB
     */
    setMongoPortVar(port_var: string): void;
    /**
    * set the name of the ENV variable corresponding to your DB user
    * @param user_var The name of your env variable corresponding to your DB user
    */
    setMongoUserVar(user_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your DB password
     * @param pass_var The name of your env variable corresponding to the password of your DB user
     */
    setMongoPassVar(pass_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your minio endpoint
     * @param end_var The name of your env variable corresponding to your minio endpoint
     */
    setMinioEndpointVar(end_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your minio access key
     * @param key_var The name of your env variable corresponding to your minio access key
     */
    setMinioAccessKeyVar(key_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your minio secret key
     * @param key_var The name of your env variable corresponding to your minio secret key
     */
    setMinioSecretKeyVar(key_var: string): void;
    /**
     * set the name of the ENV variable corresponding to the name of your minio bucket
     * @param bucket_var The name of your env variable corresponding to the name of your Minio bucket
     */
    setMinioBucketVar(bucket_var: string): void;
    /**
     * set the name of the ENV variable corresponding to your Minio port
     * @param port_var The name of your env variable corresponding to your minio port
     */
    setMinioPortVar(port_var: string): void;
    /**
     * set the name of the ENV variable corresponding to the ZIP you want to back up
     * @param name_var The name of your env variable corresponding to the ZIP you want to back up
     */
    setZipNameVar(name_var: string): void;
    /**
     * set the name of the ENV variable corresponding to the root path you want to back up to
     * i.e. /base/path/
     * @param root_var The name of your env variable corresponding to the root path you want to back up to.
     */
    setMinioRootPathVar(root_var: string): void;
    /**
     * set the name of the ENV variable corresponding to whether you connect to your DB using ssl
     * @param ssl_var The name of your env variable corresponding to whether you connect to your DB using ssl
     */
    setMongoSSLVar(ssl_var: string): void;
    /**
     * set the name of the ENV variable corresponding to whether you connect to minio using ssl
     * @param ssl_var The name of your env variable corresponding to whether you connect to minio using ssl
     */
    setMinioSSLVar(ssl_var: string): void;
    /**
     * set the name of the ENV variable corresponding to the webhook url used for slack notifications
     * @param web_var The name of your env variable corresponding to the webhook url used for slack notifications
     */
    setWebhookURLVar(web_var: string): void;
}
