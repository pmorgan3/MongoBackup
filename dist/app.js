"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MongoBackup_1 = require("./MongoBackup");
require('dotenv').config;
var backup_obj = new MongoBackup_1.MongoBackup();
backup_obj.createBackup(true);
backup_obj.uploadBackup(true);
