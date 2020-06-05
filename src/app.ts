import { MongoBackup } from './MongoBackup';
require('dotenv').config


let backup_obj = new MongoBackup()
backup_obj.createBackup(true)
backup_obj.uploadBackup(true)