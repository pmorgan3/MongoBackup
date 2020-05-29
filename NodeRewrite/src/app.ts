require('dotenv').config
import { MongoBackupType } from './types'
import * as Minio from 'minio'
import { execSync } from 'child_process'
// This is the instance of the object that all actions will be
// preformed on
const Backup: MongoBackupType = {
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
  UseSSL: process.env.USE_SSL==='true',
  MinioSSL: process.env.MINIO_SSL==='true'
}
// Minio client object
let client_obj: Minio.ClientOptions = {
  endPoint: Backup.MinioEndpoint,
  useSSL: Backup.MinioSSL,
  accessKey: Backup.MinioAccessKey,
  secretKey: Backup.MinioSecretKey
}

// +null === 0
if(Backup.MinioPort !== 0){
  client_obj = { ...client_obj, port: Backup.MinioPort}
}
let client = new Minio.Client({
  endPoint: Backup.MinioEndpoint,
  useSSL: Backup.MinioSSL,
  accessKey: Backup.MinioAccessKey,
  secretKey: Backup.MinioSecretKey
})
const output_name = Backup.Database + '_' + Date.now()

// Call mongodump
const exec_string = `mongodump --host ${Backup.MongoHost} --port ${Backup.MongoPort} -vvvv --username ${Backup.MongoUser} --password ${Backup.MongoPass} --db ${Backup.Database} --authenticationDatabase admin --out ${output_name} ${Backup.UseSSL ? '--ssl' : ''}`

//exec mongodump
execSync(exec_string)

// zip up mongodump
const zip_string = `zip -r ${output_name}.zip ${output_name}`
execSync(zip_string)

let minio_object_name = Backup.MinioRootPath === undefined ? Backup.MinioRootPath + output_name : output_name

client.putObject(Backup.MinioBucket, minio_object_name, output_name + '.zip').catch((err) => {
  console.log(err)
})

// Clean up
const clean_up_string = `rm -rf ${output_name}`
execSync(clean_up_string)
