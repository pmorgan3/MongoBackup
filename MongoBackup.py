# Copyright 2020 Webitects Inc
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import sys
import getopt
import urllib
import logging
import shutil
import time
import pymongo
import subprocess
import os
import datetime
from shlex import split as command_to_array
from subprocess import CalledProcessError, check_call
from zipfile import ZipFile
from os import path, listdir, makedirs, devnull
from minio import Minio
from minio.error import (NoSuchKey, ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists)

slash_type = '\\' if os.name == 'nt' else '/'

def pairwise(iterable):
    """Returns every two elements in the given list
    Arguments:
        iterable {list} -- The input List
    """    
    a = iter(iterable)
    return zip(a, a)
# End pairwise

class MongoBackup:
    def __init__(self, host, user, password, port, access_key, secret_key,  database_name, endpoint, bucket, location, restore=False, zip_name="", prefix=None, ssl=False, minio_ssl=False) -> None:
        self.host = host
        self.password = password
        self.port = port
        self.user = user
        self.ssl = ssl
        self.secret_key = secret_key
        self.access_key = access_key
        self.minio_bucket = bucket
        self.database_name = str(database_name).strip()
        self.minio_endpoint = endpoint
        self.location = location
        self.minio_ssl = minio_ssl
        self.prefix = prefix
        self.restore = restore
        self.zip_name = zip_name.strip()
    # End __init__()
    
    def backup_to_minio(self):
        print("Uploading zip file...")
        minioClient = Minio(self.minio_endpoint.strip(),
                    access_key=self.access_key.strip(),
                    secret_key=self.secret_key.strip(),
                    secure=self.minio_ssl)
        try:
            minioClient.make_bucket(self.minio_bucket, location=self.location)
        except BucketAlreadyOwnedByYou as err:
            pass
        except BucketAlreadyExists as err:
            pass
        except ResponseError as err:
            raise

        try:
            minioClient.fput_object(self.minio_bucket, self.zip_name, self.zip_name)
        except ResponseError as err:
            print(err)
        print("Uploaded zip")
        print("Backup process complete. Have a nice day :)")
    # End backup_to_minio()

    def has_prefix(self, filename: str, database_name: str) -> bool:
        if filename.find(database_name) is 0:
            return False
        return True
    # End has_prefix

    def remove_prefix(self, folder_path: str, database_name: str) -> str:
        return os.getcwd() + slash_type + folder_path[folder_path.find(database_name):]
    # End remove_prefix

    def restore_from_minio(self):
        minioClient = Minio(self.minio_endpoint.strip(),
                    access_key=self.access_key.strip(),
                    secret_key=self.secret_key.strip(),
                    secure=self.minio_ssl)
        objects = minioClient.list_objects(self.minio_bucket)
        try:
            self.create_folder_restore() 
            minioClient.fget_object(self.minio_bucket, self.zip_name, self.backup_folder_path)
            with ZipFile(self.zip_name, 'r') as zipObj:
                zipObj.extractall()
            if self.has_prefix(self.zip_name, self.database_name):
                self.backup_folder_path = self.remove_prefix(self.zip_name, self.database_name) 
            os.chdir(self.backup_folder_path[:-4])
            use_ssl = ['mongorestore',
                '-d', '%s' % self.database_name,
                '--host', '%s' % self.host,
                '--username', '%s' % self.user,
                '--password', '%s' % self.password,
                '--authenticationDatabase', 'admin',
                '%s' % self.database_name,
                ]
            use_ssl = use_ssl + ['--ssl'] if self.ssl is True else use_ssl
    
            restore_output = subprocess.check_output(use_ssl)
            logging.info(restore_output)
        except NoSuchKey as err:
            print(err)
            print("Seems like that file doesn't exist. Here are the objects currently in the bucket:")
            for obj in objects:
                print(obj.object_name)
            quit
    # End restore_from_minio()
    def restore_mongodump(self):
        self.restore_from_minio()

    def create_folder_restore(self) -> None:
        path = os.getcwd()
        path = path + slash_type + self.zip_name
        self.backup_folder_path = path
        try:
            f = open(self.zip_name, 'x')
            f.close()
        except Exception:
            pass
    # End create_folder_restore()

    def create_folder(self) -> None:
        d = str(int(time.time())) 
        path = os.getcwd()
        path = path + slash_type + self.database_name +  "_backup" + "_" + d
        if self.prefix is not "":
            path = os.getcwd() + slash_type + self.prefix + "_" + self.database_name + "_" + d
        else:
            print("no prefix")
            path = os.getcwd() + slash_type + self.database_name + "_" + d
        self.backup_folder_path = path
        try:
            os.mkdir(self.backup_folder_path)
        except Exception:
            pass
    # End create_folder()

    def backup_mongodump(self) -> None:
        today = datetime.datetime.now()
        self.create_folder()
        output_dir = os.path.abspath(os.path.join(
            os.path.curdir,
            self.backup_folder_path
        ))
        print("output_dir:", output_dir)
        print("self.backup_folder_path:", self.backup_folder_path)
        assert os.path.isdir(output_dir), 'Directory %s can\'t be found.' % output_dir

        output_dir = os.path.abspath(os.path.join(output_dir, '%s_%s'% (self.database_name, str(int(time.time())))))

        #logging.info('Backing up %s from %s to %s' % (db, hostname, output_dir))

        # Theres definitely a better way to do this
        use_ssl = ['mongodump',
                '--host', '%s' % self.host,
                '--username', '%s' % self.user,
                '--password', '%s' % self.password,
                '--authenticationDatabase', 'admin',
                '--db', '%s' % self.database_name,
                '-o', '%s' % output_dir]
        use_ssl = use_ssl + ['--ssl'] if self.ssl is True else use_ssl

        backup_output = subprocess.check_output(use_ssl)
        logging.info(backup_output)
        self.zip_name = os.path.basename(shutil.make_archive(self.backup_folder_path, 'zip', self.backup_folder_path))
        self.backup_to_minio()
    # End backup_mongodump()
# End class

def file_parse(file,  prefix, use_environ, ssl, use_prefix, minio_ssl, _restore, zip_name) -> None:
    """Parses the given file (If applicable) """

    fp = open(file, 'r')

    # Allows for different formatting of the options
    db_name_variants = ["database", "name", "database_name", "db", "MongoDatabase", "mongo_database", "MongoDB", "MongoDb"]
    access_variants = ["access_key", "access", "accesskey", "accessKey"]
    secret_variants = ["secret", "secret_key", "secretKey"]
    mongo_host_variants = ["host", "mongo_host", "Host", "MongoHost"]
    mongo_pass_variants = ["pass", "password", "MongoPass", "mongo_pass", "MongoPassword", "Password", "mongo_password"]
    mongo_port_variants = ["port", "mongo_port", "MongoPort", "Port"]
    mongo_user_variants = ["User", "user", "MongoUser", "mongo_user"]
    minio_endpoint_variants = ["MinioEndpoint", "Endpoint", "minio_endpoint", "endpoint"]
    minio_bucket_variants = ["MinioBucket", "Bucket", "minio_bucket", "bucket", "BucketName"]
    minio_location_variants = ["MinioLocation", "minio_location", "location"]
    zip_name_variants = ["Zip", "zipname", "zip name", "ZipName", "FolderName"]

    db = None
    access = None
    secret = None
    mongo_host = None
    mongo_user = None
    mongo_pass = None
    mongo_port = None
    minio_bucket = None
    zip_name = ""
    minio_location = None
    minio_endpoint = None
    for line in fp:
        arg_list = line.split('=', 1)
        for arg, val in pairwise(arg_list):
            if arg in db_name_variants:
                db = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in access_variants:
                access = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in secret_variants:
                secret = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in mongo_host_variants:
                mongo_host = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in mongo_pass_variants:
                mongo_pass = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in mongo_port_variants:
                mongo_port = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in mongo_user_variants:
                mongo_user = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in minio_endpoint_variants:
                minio_endpoint = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in minio_bucket_variants:
                minio_bucket = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in minio_location_variants:
                minio_location = os.environ[val.strip()] if use_environ is True else val.strip()
            elif arg in zip_name_variants:
                zip_name = os.environ[val.strip()] if use_environ is True else val.strip()
    
    mongo = MongoBackup(mongo_host, mongo_user, mongo_pass, mongo_port, access, secret, db, minio_endpoint, minio_bucket, minio_location, restore=_restore, zip_name=zip_name, prefix=prefix,ssl=ssl, minio_ssl=minio_ssl )
    fp.close()
    mongo.backup_mongodump() if _restore is False else mongo.restore_mongodump()
# End file_parse 

def main():
    argument_list = sys.argv[1:]
    short_options = "fesp"
    options = [
            "file=",
            "environment",
            "ssl",
            "prefix=",
            "minioSSL",
            "zip="
            ]

    try:
        arguments, values = getopt.getopt(argument_list, short_options, options)
    except getopt.error as err:
        print(str(err))
        sys.exit(2)

    # Declare variables for use later
    file = None
    use_env = False
    use_ssl = False
    use_prefix = False
    minio_ssl = False
    restore = False
    prefix = ""
    zip_name = ""
    # Loop through the arguments and assign them to our variables
    for curr_arg, curr_val in arguments:
        if curr_arg in ("-f", "--file"):
            file = curr_val
        elif curr_arg in ("-e", "--environment"):
            use_env = True
        elif curr_arg in ("-s", "--ssl"):
            use_ssl = True
        elif curr_arg in ('-p', "--prefix"):
            use_prefix = True
            prefix = curr_val
        elif curr_arg in ("--minioSSL"):
            minio_ssl = True
        elif curr_arg in ("-r", "--restore"):
            restore = True
        elif curr_arg in ("-z", "--zip"):
            zip_name = curr_val

    if file is None:
        print('ERROR: Need input file')
        print('Usage example: python3 MongoBackup.py --file=credentials.txt')
    else:
        print('starting backup process...')
        file_parse(file, prefix, use_env, use_ssl, use_prefix, minio_ssl, restore, zip_name)
    
# End main

if __name__ == "__main__":
    main()
