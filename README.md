# MongoBackup.py

This script copies over all the collections in a mongo database to json files. It then compresses the files into a .zip format and uploads them to min.io

## Getting Started


### Prerequisites

To use this script you need:

 - Python3.7.7 or later
 - [MongoDB CLI tools](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/ "link to download mongodb tools")


### Installation

Run ``` pip3 -r requirements.txt ```

### Usage
Running the script is simple.

Simply type
```
python3 MongoBackup.py --file=credentials.txt
```

credentials.txt can be named anything but it should look like this:

```
access=your_minio_access_key
secret=your_minio_secret_key
Endpoint=your_minio_endpoint
BucketName=your_minio_bucket_name
database=your_db_name
port=your_db_port
MongoHost=mongo_hostname
User=mongo_admin_username
Password=mongo_admin_password
```

## Deployment

This script is build to work on both windows and Linux. However, windows performance has not been tested



## License

This project is licensed under the Apache 2.0 License - see the [Full License](https://www.apache.org/licenses/LICENSE-2.0) for details
