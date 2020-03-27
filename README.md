# MongoBackup.py

This script copies over all the collections in a mongo database to json files. It then compresses the files into a .zip format and uploads them to min.io

## Getting Started


### Prerequisites

To use this script you need:
```
 Python3.7.7 or later
```

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
MongoConnection=your_mongo_connection_string
database=your_mongo_database_name
access=your_minio_access_key
secret=your_minio_secret_key
```

## Important Note

Due to a limitation in the compression library used by this software, Mongo Databases over 4GB in size may cause this software to not work as intended

## Deployment

This script is build to work on both windows and Linux. However, windows performance has not been tested



## License

This project is licensed under the Apache 2.0 License - see the [https://www.apache.org/licenses/LICENSE-2.0](Full License) for details
