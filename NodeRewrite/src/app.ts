import { MongoBackup } from './MongoBackup';
require('dotenv').config
import {  MongoBackupConfig } from './types'
import * as Minio from 'minio'
import { execSync} from 'child_process'
import * as fs from 'fs'
import * as winston from 'winston'
import * as SlackHook from 'winston-slack-webhook-transport'
import * as request from 'request'
// This is the instance of the object that all actions will be
// preformed on
export const Backup: MongoBackupConfig = {
  Database: process.env.DATABASE,
  MongoHost: process.env.MONGO_HOST,
  MongoPort: process.env.MONGO_PORT,
  MongoUser: process.env.MONGO_USER,
  MongoPass: process.env.MONGO_PASSWORD,
  MinioEndpoint: process.env.MINIO_ENDPOINT,
  MinioAccessKey: process.env.MINIO_ACCESS,
  MinioSecretKey: process.env.MINIO_SECRET,
  MinioBucket: process.env.MINIO_BUCKET,
  MinioPort: +process.env.MINIO_PORT, // +null === 0
  ZipName: process.env.ZIP_NAME,
  MinioRootPath: process.env.MINIO_ROOT_PATH,
  MongoSSL: process.env.MONGO_SSL==='true',
  MinioSSL: process.env.MINIO_SSL==='true',
  WebhookURL: process.env.SLACK_WEBHOOK_URL
}
/*
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new SlackHook({
      webhookUrl: Backup.WebhookURL
    })
  ]
})
// Minio client object
let client_obj: Minio.ClientOptions = {
  endPoint: Backup.MinioEndpoint,
  //port: Backup.MinioPort,
  useSSL: Backup.MinioSSL,
  accessKey: Backup.MinioAccessKey,
  secretKey: Backup.MinioSecretKey
}

// +null === 0
if(Backup.MinioPort !== 0){
  client_obj = { ...client_obj, port: Backup.MinioPort}
}
let client = new Minio.Client({...client_obj})
// Now we check if the bucket exists
client.bucketExists(Backup.MinioBucket, (err, exists) => {
  if(exists === false){
    // If it doesn't exist, make the bucket
    client.makeBucket(Backup.MinioBucket, 'us-east-1', (error)=> {
      logger.error(error.message, ()=> {
      })
    })
  }
})
// This will be the name of the output folder
let output_name = Backup.Database + '_' + Date.now()

// Call mongodump
const exec_string = `mongodump --host ${Backup.MongoHost} --port ${Backup.MongoPort} --forceTableScan -vvvv --username ${Backup.MongoUser} --password ${Backup.MongoPass} --db ${Backup.Database} --authenticationDatabase admin --out ${output_name} ${Backup.MongoSSL ? '--ssl' : ''}`

//exec mongodump
execSync(exec_string)

// zip up mongodump
const zip_string = `zip -r ${output_name}.zip ${output_name}`
execSync(zip_string)

// This will be the name of the object that gets uploaded
let minio_object_name = Backup.MinioRootPath !== undefined ? Backup.MinioRootPath + output_name : output_name
minio_object_name += '.zip'
let unzipped = output_name
output_name += '.zip'

// Now we have to make a filestream from the output
let filestream = fs.createReadStream(output_name)
let fileStat = fs.stat(output_name, (err, stats) => {
  // And send that stream to minio
  client.putObject(Backup.MinioBucket, minio_object_name, filestream, stats.size, (err, etag) => {
      console.log(err, etag)
       if(err){
        logger.error(err.message)
      }
      else{  
        logger.info(`Backed up ${Backup.Database} to minio.\n\n OutputName: ${output_name}\n\nRoot Path: ${Backup.MinioRootPath ? Backup.MinioRootPath : Backup.MinioBucket + '/'}`)
      }
  })
})

// Clean up
const clean_up_string = `rm -rf ${output_name} ${unzipped}`
execSync(clean_up_string)
*/

let backup_obj = new MongoBackup()
backup_obj.createBackup(true)
backup_obj.uploadBackup(true)
