"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoBackup = void 0;
var child_process_1 = require("child_process");
var Minio = __importStar(require("minio"));
var winston_1 = __importDefault(require("winston"));
var winston_slack_webhook_transport_1 = __importDefault(require("winston-slack-webhook-transport"));
var fs = __importStar(require("fs"));
var MongoBackup = /** @class */ (function () {
    function MongoBackup(Backup) {
        this.Database = Backup ? Backup.Database : process.env.DATABASE;
        this.MongoHost = Backup ? Backup.MongoHost : process.env.MONGO_HOST;
        this.MongoPort = Backup ? Backup.MongoPort : process.env.MONGO_PORT;
        this.MongoUser = Backup ? Backup.MongoUser : process.env.MONGO_USER;
        this.MongoPass = Backup ? Backup.MongoPass : process.env.MONGO_PASSWORD;
        this.MinioEndpoint = Backup ? Backup.MinioEndpoint : process.env.MINIO_ENDPOINT;
        this.MinioSecretKey = Backup ? Backup.MinioSecretKey : process.env.MINIO_SECRET;
        this.MinioAccessKey = Backup ? Backup.MinioAccessKey : process.env.MINIO_ACCESS;
        this.MinioBucket = Backup ? Backup.MinioBucket : process.env.MINIO_BUCKET;
        this.MinioPort = Backup ? Backup.MinioPort : +process.env.MINIO_PORT;
        this.ZipName = Backup ? Backup.ZipName : process.env.ZIP_NAME;
        this.MinioRootPath = Backup ? Backup.MinioRootPath : process.env.MINIO_ROOT_PATH;
        this.MongoSSL = Backup ? Backup.MongoSSL : process.env.MONGO_SSL === 'true';
        this.MinioSSL = Backup ? Backup.MinioSSL : process.env.MINIO_SSL === 'true';
        this.WebhookURL = Backup ? Backup.WebhookURL : process.env.SLACK_WEBHOOK_URL;
        this.Logger = this.WebhookURL ? winston_1.default.createLogger({
            level: 'info',
            transports: [
                new winston_slack_webhook_transport_1.default({
                    webhookUrl: this.WebhookURL
                })
            ]
        }) : undefined;
        this.initMinio();
    }
    MongoBackup.prototype.initMinio = function () {
        var _this = this;
        var _temp_obj = {
            endPoint: this.MinioEndpoint,
            useSSL: this.MinioSSL,
            accessKey: this.MinioAccessKey,
            secretKey: this.MinioSecretKey
        };
        if (this.MinioPort !== 0) {
            _temp_obj = __assign(__assign({}, _temp_obj), { port: this.MinioPort });
        }
        this.minio_client = new Minio.Client(_temp_obj);
        this.minio_client.bucketExists(this.MinioBucket, function (err, exists) {
            if (exists === false) {
                _this.minio_client.makeBucket(_this.MinioBucket, 'us-east-1', function (error) {
                    _this.Logger ? _this.Logger.error(error.message, function () { }) : console.error(error);
                });
            }
        });
        this.OutputName = this.Database + '_' + Date.now();
    };
    MongoBackup.prototype.createBackup = function (verbose) {
        // Call MongoDump
        var use_mongo_pass = this.MongoPass === undefined ? "" : "--password " + this.MongoPass;
        var use_mongo_user = this.MongoUser === undefined ? "" : "--username " + this.MongoUser;
        var exec_string = "mongodump --host " + this.MongoHost + " --port " + this.MongoPort + " --forceTableScan -vvvv " + use_mongo_user + " " + use_mongo_pass + " --db " + this.Database + " --authenticationDatabase admin --out " + this.OutputName + " " + (this.MongoSSL ? '--ssl' : '');
        if (verbose) {
            console.log("Now executing mongodump.");
            console.log("Full exec string: " + exec_string);
        }
        // Exec mongo dump
        child_process_1.execSync(exec_string);
        // zip up mongodump
        var zip_string = "zip -r " + this.OutputName + ".zip " + this.OutputName;
        if (verbose) {
            console.log("Now zipping file.");
            console.log("Full exec string: " + zip_string);
        }
        child_process_1.execSync(zip_string);
    };
    MongoBackup.prototype.uploadBackup = function (verbose) {
        var _this = this;
        var minio_object_name = this.MinioRootPath !== undefined ? this.MinioRootPath + this.OutputName : this.OutputName;
        minio_object_name += '.zip';
        if (verbose) {
            console.log("Uploading object with name '" + minio_object_name + "'");
        }
        this.unzipped = this.OutputName;
        this.OutputName += '.zip';
        // Now we have to make a filestream from the output
        var filestream = fs.createReadStream(this.OutputName);
        var fileStat = fs.stat(this.OutputName, function (err, stats) {
            // And send that stream to minio
            _this.minio_client.putObject(_this.MinioBucket, minio_object_name, filestream, stats.size, function (err, etag) {
                console.log(err, etag);
                if (err) {
                    _this.Logger ? _this.Logger.error(err.message) : console.error(err.message);
                }
                else {
                    var info_string = "Backed up " + _this.Database + " to minio.\n\n OutputName: " + _this.OutputName + "\n\nRoot Path: " + (_this.MinioRootPath ? _this.MinioRootPath : _this.MinioBucket + '/');
                    _this.Logger ? _this.Logger.info(info_string) : console.log(info_string);
                }
            });
        });
    };
    MongoBackup.prototype.cleanUp = function (verbose) {
        if (verbose) {
            console.log("Now running cleanup: 'rm -rf " + this.OutputName + " " + this.unzipped + "'");
        }
        var clean_up_string = "rm -rf " + this.OutputName + " " + this.unzipped;
        child_process_1.execSync(clean_up_string);
    };
    // Change the names of the env variables
    /**
     * set the name of the ENV variable corresponding to your DB name
     * @param db_var The name of your env variable corresponding to the name of your DB
     */
    MongoBackup.prototype.setDatabaseVar = function (db_var) {
        this.Database = process.env[db_var];
    };
    /**
     * set the name of the ENV variable corresponding to your DB host
     * @param host_var The name of your env variable corresponding to your DB host
     */
    MongoBackup.prototype.setMongoHostVar = function (host_var) {
        this.MongoHost = process.env[host_var];
    };
    /**
     * set the name of the ENV variable corresponding to your DB port
     * @param port_var The name of your env variable corresponding to the port of your DB
     */
    MongoBackup.prototype.setMongoPortVar = function (port_var) {
        this.MongoPort = process.env[port_var];
    };
    /**
    * set the name of the ENV variable corresponding to your DB user
    * @param user_var The name of your env variable corresponding to your DB user
    */
    MongoBackup.prototype.setMongoUserVar = function (user_var) {
        this.MongoUser = process.env[user_var];
    };
    /**
     * set the name of the ENV variable corresponding to your DB password
     * @param pass_var The name of your env variable corresponding to the password of your DB user
     */
    MongoBackup.prototype.setMongoPassVar = function (pass_var) {
        this.MongoPass = process.env[pass_var];
    };
    /**
     * set the name of the ENV variable corresponding to your minio endpoint
     * @param end_var The name of your env variable corresponding to your minio endpoint
     */
    MongoBackup.prototype.setMinioEndpointVar = function (end_var) {
        this.MinioEndpoint = process.env[end_var];
    };
    /**
     * set the name of the ENV variable corresponding to your minio access key
     * @param key_var The name of your env variable corresponding to your minio access key
     */
    MongoBackup.prototype.setMinioAccessKeyVar = function (key_var) {
        this.MinioAccessKey = process.env[key_var];
    };
    /**
     * set the name of the ENV variable corresponding to your minio secret key
     * @param key_var The name of your env variable corresponding to your minio secret key
     */
    MongoBackup.prototype.setMinioSecretKeyVar = function (key_var) {
        this.MinioSecretKey = process.env[key_var];
    };
    /**
     * set the name of the ENV variable corresponding to the name of your minio bucket
     * @param bucket_var The name of your env variable corresponding to the name of your Minio bucket
     */
    MongoBackup.prototype.setMinioBucketVar = function (bucket_var) {
        this.MinioBucket = process.env[bucket_var];
    };
    /**
     * set the name of the ENV variable corresponding to your Minio port
     * @param port_var The name of your env variable corresponding to your minio port
     */
    MongoBackup.prototype.setMinioPortVar = function (port_var) {
        this.MinioPort = +process.env[port_var];
    };
    /**
     * set the name of the ENV variable corresponding to the ZIP you want to back up
     * @param name_var The name of your env variable corresponding to the ZIP you want to back up
     */
    MongoBackup.prototype.setZipNameVar = function (name_var) {
        this.ZipName = process.env[name_var];
    };
    /**
     * set the name of the ENV variable corresponding to the root path you want to back up to
     * i.e. /base/path/
     * @param root_var The name of your env variable corresponding to the root path you want to back up to.
     */
    MongoBackup.prototype.setMinioRootPathVar = function (root_var) {
        this.MinioRootPath = process.env[root_var];
    };
    /**
     * set the name of the ENV variable corresponding to whether you connect to your DB using ssl
     * @param ssl_var The name of your env variable corresponding to whether you connect to your DB using ssl
     */
    MongoBackup.prototype.setMongoSSLVar = function (ssl_var) {
        this.MongoSSL = process.env[ssl_var] === 'true';
    };
    /**
     * set the name of the ENV variable corresponding to whether you connect to minio using ssl
     * @param ssl_var The name of your env variable corresponding to whether you connect to minio using ssl
     */
    MongoBackup.prototype.setMinioSSLVar = function (ssl_var) {
        this.MinioSSL = process.env[ssl_var] === 'true';
    };
    /**
     * set the name of the ENV variable corresponding to the webhook url used for slack notifications
     * @param web_var The name of your env variable corresponding to the webhook url used for slack notifications
     */
    MongoBackup.prototype.setWebhookURLVar = function (web_var) {
        this.WebhookURL = process.env[web_var];
    };
    return MongoBackup;
}());
exports.MongoBackup = MongoBackup;
