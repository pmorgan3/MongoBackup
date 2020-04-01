# MongoBackup.py

This script runs mongodump on the given database. It then compresses the dumps into a .zip format and uploads them to min.io

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

If you want to use environment variables instead of pasting your information in plain text, run the script using the ```-e``` or  ```--environment``` flags. And have your credentials.txt file store your variable names instead of their values. 

## Deployment

This script is built to run on most unix systems. As long as you have a unix based terminal and mongodb tools installed you should be fine.


## License

This project is licensed under the Apache 2.0 License - see the [Full License](https://www.apache.org/licenses/LICENSE-2.0) for details
