import { execSync } from 'child_process';
import { Backup } from './config';
import { MongoBackupConfig} from './types';
import * as Minio from 'minio'
import winston from 'winston';
import SlackHook from 'winston-slack-webhook-transport';
import * as fs from 'fs'
export class MongoBackup {
    Database: string
    MongoHost: string 
    MongoPort?: string
    MongoUser?: string
    MongoPass?: string
    MinioEndpoint: string
    MinioSecretKey: string
    MinioAccessKey: string
    MinioBucket: string
    MinioPort?: number 
    ZipName?: string
    MinioRootPath?: string
    MongoSSL: boolean
    MinioSSL: boolean 
    WebhookURL?: string
    Logger?: winston.Logger
    OutputName: string
    private unzipped: string
    private minio_client: Minio.Client
    constructor(Backup?: MongoBackupConfig){
        this.Database = Backup ? Backup.Database : process.env.DATABASE
        this.MongoHost = Backup ? Backup.MongoHost : process.env.MONGO_HOST
        this.MongoPort = Backup ? Backup.MongoPort : process.env.MONGO_PORT
        this.MongoUser = Backup ? Backup.MongoUser : process.env.MONGO_USER
        this.MongoPass = Backup ? Backup.MongoPass : process.env.MONGO_PASSWORD
        this.MinioEndpoint = Backup ? Backup.MinioEndpoint : process.env.MINIO_ENDPOINT
        this.MinioSecretKey = Backup ? Backup.MinioSecretKey : process.env.MINIO_SECRET
        this.MinioAccessKey = Backup ? Backup.MinioAccessKey : process.env.MINIO_ACCESS
        this.MinioBucket = Backup ? Backup.MinioBucket : process.env.MINIO_BUCKET
        this.MinioPort = Backup ? Backup.MinioPort : +process.env.MINIO_PORT
        this.ZipName = Backup ? Backup.ZipName : process.env.ZIP_NAME
        this.MinioRootPath = Backup ? Backup.MinioRootPath : process.env.MINIO_ROOT_PATH
        this.MongoSSL = Backup ? Backup.MongoSSL : process.env.MONGO_SSL==='true'
        this.MinioSSL = Backup ? Backup.MinioSSL : process.env.MINIO_SSL==='true'
        this.WebhookURL = Backup ? Backup.WebhookURL : process.env.SLACK_WEBHOOK_URL
        this.Logger = this.WebhookURL ? winston.createLogger({
            level: 'info',
            transports: [
                new SlackHook({
                    webhookUrl: this.WebhookURL
                })
            ]
        }) : undefined
        this.initMinio()
    } 
   private initMinio(){
        let _temp_obj: Minio.ClientOptions = {
            endPoint: this.MinioEndpoint,
            useSSL: this.MinioSSL,
            accessKey: this.MinioAccessKey,
            secretKey: this.MinioSecretKey
        }
        if(this.MinioPort !== 0){
            _temp_obj = {..._temp_obj, port: this.MinioPort}
        }
        this.minio_client = new Minio.Client(_temp_obj)
        this.minio_client.bucketExists(this.MinioBucket, (err, exists)=> {
            if(exists===false){
                this.minio_client.makeBucket(this.MinioBucket, 'us-east-1', (error) => {
                    this.Logger ? this.Logger.error(error.message, ()=>{}) : console.error(error)
                })
            }
        })
        this.OutputName = this.Database + '_' + Date.now()
   } 
   public createBackup(verbose?: boolean) {
    // Call MongoDump
    const use_mongo_pass = this.MongoPass === undefined ? `` : `--password ${this.MongoPass}`
    const use_mongo_user = this.MongoUser === undefined ? `` : `--username ${this.MongoUser}`
    const exec_string = `mongodump --host ${this.MongoHost} --port ${this.MongoPort} --forceTableScan -vvvv ${use_mongo_user} ${use_mongo_pass} --db ${this.Database} --authenticationDatabase admin --out ${this.OutputName} ${this.MongoSSL ? '--ssl' : ''}`

    if(verbose){
        console.log(`Now executing mongodump.`)
        console.log(`Full exec string: ${exec_string}`)
    }
    // Exec mongo dump
    execSync(exec_string)

    // zip up mongodump
    
    const zip_string = `zip -r ${this.OutputName}.zip ${this.OutputName}`
    if(verbose){
        console.log(`Now zipping file.`)
        console.log(`Full exec string: ${zip_string}`)
    }
    execSync(zip_string)
   }
   public uploadBackup(verbose?: boolean) {
    let minio_object_name = this.MinioRootPath !== undefined ? this.MinioRootPath + this.OutputName : this.OutputName
    
    minio_object_name += '.zip'
    if(verbose){
        console.log(`Uploading object with name '${minio_object_name}'`)
    }
    this.unzipped = this.OutputName
    this.OutputName += '.zip'

    // Now we have to make a filestream from the output
    let filestream = fs.createReadStream(this.OutputName)
    let fileStat = fs.stat(this.OutputName, (err, stats) => {
      // And send that stream to minio
      this.minio_client.putObject(this.MinioBucket, minio_object_name, filestream, stats.size, (err, etag) => {
        console.log(err, etag)
        if(err){

            this.Logger ? this.Logger.error(err.message) : console.error(err.message)
        }
        else{  
            let info_string = `Backed up ${this.Database} to minio.\n\n OutputName: ${this.OutputName}\n\nRoot Path: ${this.MinioRootPath ? this.MinioRootPath : this.MinioBucket + '/'}`
            this.Logger? this.Logger.info(info_string) : console.log(info_string)
        }
      })
    })
   }

   public cleanUp(verbose?: boolean) {
    if(verbose){
        console.log(`Now running cleanup: 'rm -rf ${this.OutputName} ${this.unzipped}'`)
    }
    const clean_up_string = `rm -rf ${this.OutputName} ${this.unzipped}`
    execSync(clean_up_string)
   }


   // Change the names of the env variables

   /**
    * set the name of the ENV variable corresponding to your DB name
    * @param db_var The name of your env variable corresponding to the name of your DB
    */
   public setDatabaseVar(db_var: string){
       this.Database = process.env[db_var]
   }
   /**
    * set the name of the ENV variable corresponding to your DB host
    * @param host_var The name of your env variable corresponding to your DB host
    */
   public setMongoHostVar(host_var: string){
       this.MongoHost = process.env[host_var]
   }
   /**
    * set the name of the ENV variable corresponding to your DB port
    * @param port_var The name of your env variable corresponding to the port of your DB
    */
   public setMongoPortVar(port_var: string){
       this.MongoPort = process.env[port_var]
   }
    /**
    * set the name of the ENV variable corresponding to your DB user
    * @param user_var The name of your env variable corresponding to your DB user
    */
   public setMongoUserVar(user_var: string){
       this.MongoUser = process.env[user_var]
   }
   /**
    * set the name of the ENV variable corresponding to your DB password
    * @param pass_var The name of your env variable corresponding to the password of your DB user
    */
   public setMongoPassVar(pass_var: string){
       this.MongoPass = process.env[pass_var]
   }
   /**
    * set the name of the ENV variable corresponding to your minio endpoint
    * @param end_var The name of your env variable corresponding to your minio endpoint
    */
   public setMinioEndpointVar(end_var: string){
       this.MinioEndpoint = process.env[end_var]
   }
   /**
    * set the name of the ENV variable corresponding to your minio access key
    * @param key_var The name of your env variable corresponding to your minio access key
    */
   public setMinioAccessKeyVar(key_var: string){
       this.MinioAccessKey = process.env[key_var]
   }
   /**
    * set the name of the ENV variable corresponding to your minio secret key
    * @param key_var The name of your env variable corresponding to your minio secret key
    */
   public setMinioSecretKeyVar(key_var: string){
       this.MinioSecretKey = process.env[key_var]
   }
   /**
    * set the name of the ENV variable corresponding to the name of your minio bucket
    * @param bucket_var The name of your env variable corresponding to the name of your Minio bucket
    */
   public setMinioBucketVar(bucket_var: string){
       this.MinioBucket = process.env[bucket_var]
   }
   /**
    * set the name of the ENV variable corresponding to your Minio port
    * @param port_var The name of your env variable corresponding to your minio port
    */
   public setMinioPortVar(port_var: string){
       this.MinioPort = +process.env[port_var]
   }
   /**
    * set the name of the ENV variable corresponding to the ZIP you want to back up
    * @param name_var The name of your env variable corresponding to the ZIP you want to back up
    */
   public setZipNameVar(name_var: string){
       this.ZipName = process.env[name_var]
   }
   /**
    * set the name of the ENV variable corresponding to the root path you want to back up to
    * i.e. /base/path/
    * @param root_var The name of your env variable corresponding to the root path you want to back up to.
    */
   public setMinioRootPathVar(root_var: string){
       this.MinioRootPath = process.env[root_var]
   }
   /**
    * set the name of the ENV variable corresponding to whether you connect to your DB using ssl
    * @param ssl_var The name of your env variable corresponding to whether you connect to your DB using ssl
    */
   public setMongoSSLVar(ssl_var: string){
       this.MongoSSL = process.env[ssl_var]==='true'
   }
   /**
    * set the name of the ENV variable corresponding to whether you connect to minio using ssl
    * @param ssl_var The name of your env variable corresponding to whether you connect to minio using ssl
    */
   public setMinioSSLVar(ssl_var: string){
       this.MinioSSL = process.env[ssl_var]==='true'
   }
   /**
    * set the name of the ENV variable corresponding to the webhook url used for slack notifications
    * @param web_var The name of your env variable corresponding to the webhook url used for slack notifications
    */
   public setWebhookURLVar(web_var: string){
       this.WebhookURL = process.env[web_var]
   }

}