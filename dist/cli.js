#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
//require('./app');
var yargs_1 = __importDefault(require("yargs"));
var config_1 = require("./config");
var MongoBackup_1 = require("./MongoBackup");
var conf = config_1.Backup;
var arg = yargs_1.default.options({
    'host': {
        desc: 'Connection String for Mongodb',
        demandOption: true,
        type: 'string'
    },
    'database': {
        describe: 'The name of the database',
        demandOption: true,
        type: 'string'
    }, 'mongo-port': {
        describe: 'The database port',
        type: 'string',
        demandOption: true,
    },
    'mongo-user': {
        describe: 'The username associated with the database',
        demandOption: true,
        type: 'string'
    }, 'mongo-pass': {
        describe: 'The password used for the mongodb',
        demandOption: true,
        type: 'string'
    },
    'minio-endpoint': {
        description: 'The endpoint used to connect to your minio instance',
        demandOption: true,
        type: 'string'
    },
    'accesskey': {
        describe: 'Your Minio access key',
        demandOption: true,
        type: 'string'
    },
    'secretkey': {
        describe: 'Your Minio secret key',
        demandOption: true,
        type: 'string'
    },
    'mongo-ssl': {
        description: 'Determines whether to connect to the mongo db using ssl',
        type: 'boolean',
        default: false
    },
    'root-path': {
        describe: 'The path in your minio instance where the uploaded backup is stored',
        type: 'string'
    },
    'minio-bucket': {
        describe: 'the name of the bucket',
        demandOption: true,
        type: 'string'
    },
    'minio-ssl': {
        default: false,
        description: 'Determines if the connection to minio will be via ssl',
        type: 'boolean'
    },
    'minio-port': {
        description: 'The port used to connect to your Minio instance',
        demandOption: true,
        type: 'number'
    }, 'slack-hook': {
        description: 'The webhook used with        slack integration',
        type: 'string',
    }
}).help().argv;
conf = {
    MongoHost: arg.host,
    MongoPort: arg["mongo-port"],
    MongoSSL: arg["mongo-ssl"],
    MongoUser: arg["mongo-user"],
    MongoPass: arg["mongo-pass"],
    MinioAccessKey: arg.accesskey,
    MinioSecretKey: arg.secretkey,
    MinioPort: arg["minio-port"],
    MinioSSL: arg["minio-ssl"],
    MinioEndpoint: arg["minio-endpoint"],
    MinioRootPath: arg["root-path"],
    MinioBucket: arg["minio-bucket"],
    WebhookURL: arg["slack-hook"],
    Database: arg.database
};
var backup_obj = new MongoBackup_1.MongoBackup(conf);
backup_obj.createBackup(true);
backup_obj.uploadBackup(true);
