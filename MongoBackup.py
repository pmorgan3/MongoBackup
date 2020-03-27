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

import pandas
from minio import Minio
from minio.error import (ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists)
import argparse
import sys
import getopt
import shutil
import pymongo
from os import path, listdir, makedirs, devnull
import subprocess
import json
import os
import datetime
from shlex import split as command_to_array
from subprocess import CalledProcessError, check_call

slash_type = '\\' if os.name == 'nt' else '/'
class MongoBackup:
    def __init__(self, host, user, password, port, access_key, secret_key,  connection_string, database_name, endpoint) -> None:
        self.host = host
        self.password = password
        self.port = port
        self.user = user
        self.connection_string = connection_string
        
        self.secret_key = secret_key
        self.access_key = access_key
        self.client = pymongo.MongoClient(connection_string)
        self.database = self.client[str(database_name).strip()]
        self.collections = self.database.list_collection_names()
        self.minio_endpoint = endpoint
    # End __init__()
    
    def backup_to_minio(self):
        print("Uploading zip file...")
        minioClient = Minio(self.minio_endpoint.strip(),
                    access_key=self.access_key.strip(),
                    secret_key=self.secret_key.strip(),
                    secure=True)
        try:
            minioClient.make_bucket("testbackups", location="us-east-1")
        except BucketAlreadyOwnedByYou as err:
            pass
        except BucketAlreadyExists as err:
            pass
        except ResponseError as err:
            raise

        try:
            minioClient.fput_object("testbackups", self.zip_name, self.zip_name)
        except ResponseError as err:
            print(err)
        print("Uploaded zip")
    # End backup_to_minio()

    def create_folder(self) -> None:
        d = datetime.datetime.now().strftime('%m:%d:%Y')
        path = os.getcwd()
        path = path + slash_type + d + "_backup"
        self.backup_folder_path = path
        try:
            os.mkdir(self.backup_folder_path)
        except Exception:
            pass
    # End create_folder()

    def backup(self) -> None:
        print('\nCollections:', self.collections)
        docs = pandas.DataFrame(columns=[])
        self.create_folder()
        for collection in self.collections:

            c = self.database[str(collection.strip())]

            mongo_docs = list(c.find())

            for num, doc in enumerate(mongo_docs):
                # Convert ObjectId() to str
                doc["_id"] = str(doc["_id"])

                # get document _id from dict
                doc_id = doc["_id"]

                # create a Series obj from the MongoDB dict
                series_obj = pandas.Series(doc, name=doc_id)

                # append the MongoDB obj to the DataFrame obj
                docs = docs.append(series_obj)#.str.encode('utf-8'))

            print("Backed up", str(collection.strip()))
            self.backup_name = str(datetime.datetime.now().strftime("%m:%d:%Y::%H:%M:%S")) + "_" + str(collection.strip()) + ".json"
        
            open(os.path.join( self.backup_folder_path, self.backup_name ), "w+").close()

            docs.to_json(os.path.join(self.backup_folder_path, self.backup_name), orient='table', default_handler=str)

        print("Database successfully exported to JSON")
        print("Compressing backup folder...")
        self.zip_name = os.path.basename(shutil.make_archive(self.backup_folder_path, 'zip', self.backup_folder_path))
        print("\nCompression complete")
        self.backup_to_minio()
    # End backup()
# End class

def call(command, silent=False):
    """
    Summary:    
        @DEPRECATED

        Runs a bash command safely, with shell=false, catches any non-zero
        return codes. Raises slightly modified CalledProcessError exceptions
        on failures. 
        Note: command is a string and cannot include pipes. ]
    
    Arguments:
        command {[type]} -- [description]
    
    Keyword Arguments:
        silent {bool} -- [description] (default: {False})
    
    Raises:
        e: [description]
    
    Returns:
        [type] -- [description]
    """""

    try:
        if silent:
            with open(os.devnull, 'w') as FNULL:
                return subprocess.check_call(command_to_array(command), stdout=FNULL)
        else:
            # Using the defaults, shell=False, no i/o redirection.
            return check_call(command_to_array(command))
    except CalledProcessError as e:
        # We are modifying the erro itself for 2 reasons.
        #   1) it WILL contain login credentials
        #   2) CalledProcessError is slightly not to spec
        #   (the message variable is blank), which means
        #   cronutils.ErrorHandler would report unlabeled stack traces.
        e.message = "%s failed with error code %s" % (e.cmd[0], e.returncode)
        e.cmd = e.cmd[0] + " [arguments stripped for security]"
        raise e
# End call()

def pairwise(iterable):
    """Returns every two elements in the given list
    
    Arguments:
        iterable {list} -- The input List
    """    

    """ """
    a = iter(iterable)
    return zip(a, a)
# End pairwise

def file_parse(file) -> None:
    """Parses the given file (If applicable) """

    #print("in file_parse")
    fp = open(file, 'r')

    # Allows for different formatting of the 
    # options
    connection_string_variants = ["mongo_connection", "connection_string", "conn", "mongo_connection_string", "MongoConnection"]
    db_name_variants = ["database", "name", "database_name", "db", "MongoDatabase", "mongo_database", "MongoDB", "MongoDb"]
    collections_variants = ["collections", "collection", "col"]
    access_variants = ["access_key", "access", "accesskey", "accessKey"]
    secret_variants = ["secret", "secret_key", "secretKey"]
    mongo_host_variants = ["host", "mongo_host", "Host", "MongoHost"]
    mongo_pass_variants = ["pass", "password", "MongoPass", "mongo_pass", "MongoPassword", "Password", "mongo_password"]
    mongo_port_variants = ["port", "mongo_port", "MongoPort", "Port"]
    mongo_user_variants = ["User", "user", "MongoUser", "mongo_user"]
    minio_endpoint_variants = ["MinioEndpoint", "Endpoint", "minio_endpoint", "endpoint"]

    conn_string = None
    db = None
    col = None
    access = None
    secret = None
    mongo_host = None
    mongo_user = None
    mongo_pass = None
    mongo_port = None
    minio_endpoint = None
    for line in fp:
        arg_list = line.split('=', 1)
        for arg, val in pairwise(arg_list):
            if arg in connection_string_variants:
                conn_string = val
            elif arg in db_name_variants:
                db = val
            elif arg in collections_variants:
                col = val
            elif arg in access_variants:
                access = val
            elif arg in secret_variants:
                secret = val
            elif arg in mongo_host_variants:
                mongo_host = val
            elif arg in mongo_pass_variants:
                mongo_pass = val
            elif arg in mongo_port_variants:
                mongo_port = val
            elif arg in mongo_user_variants:
                mongo_user = val
            elif arg in minio_endpoint_variants:
                minio_endpoint = val
    
    mongo = MongoBackup(mongo_host, mongo_user, mongo_pass, mongo_port, access, secret, conn_string, db, minio_endpoint )
    fp.close()
    mongo.backup()
    
# End file_parse 

def main():
    argument_list = sys.argv[1:]
    short_options = "c:n:col:h:f:a:k:p:u:e"
    options = [
            "connection=",
            "name=",
            "db=",
            "collections=",
            "host",
            "file=",
            "accesskey=",
            "secret="
            "user=",
            "password=",
            "port=",
            "endpoint="
            ]

    try:
        arguments, values = getopt.getopt(argument_list, short_options, options)
    except getopt.error as err:
        print(str(err))
        sys.exit(2)
    print('starting backup process...')


    # Declare variables for use later
    connection_string = None
    database_name = None
    file = None
    collections = None
    access_key = None
    secret_key = None
    host = None
    password = None
    user = None
    minio_endpoint = None
    port = None
    # Loop through the arguments and assign them to our variables
    for curr_arg, curr_val in arguments:
        if curr_arg in ("-c", "--connection"):
            connection_string = curr_val
        elif curr_arg in ("-n", "--db", "--name"):
            database_name = curr_val
        elif curr_arg in ("--collections", "-col"):
            collections = curr_val
        elif curr_arg in ("-f", "--file"):
            file = curr_val
        elif curr_arg in ("-a", "--accesskey"):
            access_key = curr_val
        elif curr_arg in ("-k", "--secret"):
            secret_key = curr_val
        elif curr_arg in ("--port"):
            port = curr_val
        elif curr_arg in ("--password"):
            password = curr_val
        elif curr_arg in ("-h", "--host"):
            host = curr_val
        elif curr_arg in ("-u", "--user"):
            user = curr_val
        elif curr_arg in ("-e", "--endpoint"):
            minio_endpoint = curr_val
    mongo = MongoBackup(host, user, password, port, access_key, secret_key, connection_string, database_name, minio_endpoint)

    if file is None:
        mongo.backup()
    else:
        print('\nFile input detected. Parsing...')
        file_parse(file)
    
# End main

if __name__ == "__main__":
    main()
