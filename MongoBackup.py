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

from minio import Minio
from minio.error import (ResponseError, BucketAlreadyOwnedByYou, BucketAlreadyExists)
import argparse
import sys
import getopt
import pymongo
from os import path, listdir, makedirs, devnull
import subprocess
import json
import os
from shlex import split as command_to_array
from subprocess import CalledProcessError, check_call

class MongoBackup:
    def __init__(self, host, user, password, port, access_key, secret_key, cols, connection_string, database_name) -> None:
        #client = pymongo.MongoClient("mongodb+srv://<username>:<password>@cluster0-puhkc.mongodb.net/test?retryWrites=true&w=majority")
        #db = client.test
        self.host = host
        self.password = password
        self.port = port
        self.user = user
        self.connection_string = connection_string
        self.collections = cols
        self.secret_key = secret_key
        self.access_key = access_key
        self.database_name = database_name
    def export_csv(self):
        pass
    def export_minio(self):
        pass
    def export_json(self):
        pass

# End class

def call(command, silent=False):
    """ Runs a bash command safely, with shell=false, catches any non-zero
        return codes. Raises slightly modified CalledProcessError exceptions
        on failures. 
        Note: command is a string and cannot include pipes. """
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

def run_docker(mongo: MongoBackup):
    print("Inside run_docker")
    process = call(["docker", "run", "-d", f'--env MONGODB_HOST={mongo.host}', f"--env MONGODB_PORT={mongo.port}", f"--env MONGODB_USER={mongo.user}", f"--env MONGODB_PASS={mongo.password}", "--volume host.folder:/backup", "tutum/mongodb-backup"])
# End run_docker


def backup_mongo(mongo: MongoBackup):
    minioClient = Minio('play.min.io',
                    access_key='Q3AM3UQ867SPQQA43P2F',
                    secret_key='zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
                    secure=True)
    run_docker(mongo)
# End backup_mongo

def pairwise(iterable):
    """Returns every two elements in the given list """
    a = iter(iterable)
    return zip(a, a)
# End pairwise

def file_parse(file) -> None:
    """Parses the given file (If applicable) """

    print("in file_parse")
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

    conn_string = None
    db = None
    col = None
    access = None
    secret = None
    mongo_host = None
    mongo_user = None
    mongo_pass = None
    mongo_port = None
    for line in fp:
        arg_list = line.split('=')
        for arg, val in pairwise(arg_list):
            print('arg: ', arg)
            if arg in connection_string_variants:
                print("val: ", val)
                conn_string = val
            elif arg in db_name_variants:
                print("val: ", val)
                db = val
            elif arg in collections_variants:
                print("val: ", val)
                col = val
            elif arg in access_variants:
                print("access key: ", val)
                access = val
            elif arg in secret_variants:
                print("secret key: ", val)
                secret = val
            elif arg in mongo_host_variants:
                print("host: ", val)
                mongo_host = val
            elif arg in mongo_pass_variants:
                print("password: ", val)
                mongo_pass = val
            elif arg in mongo_port_variants:
                print("port: ", val)
                mongo_port = val
            elif arg in mongo_user_variants:
                print("user: ", val)
                mongo_user = val
    mongo: MongoBackup = MongoBackup(mongo_host, mongo_user, mongo_pass, mongo_port, access, secret, col, conn_string, db )
    backup_mongo(mongo)
    fp.close()
# End file_parse

def main():
    argument_list = sys.argv[1:]
    short_options = "c:n:col:h:f:a:k:p:u"
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
            ]

    try:
        arguments, values = getopt.getopt(argument_list, short_options, options)
    except getopt.error as err:
        print(str(err))
        sys.exit(2)

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
    mongo: MongoBackup = MongoBackup(host, user, password, port, access_key, secret_key, collections, connection_string, database_name)

    if file is None:
        backup_mongo(mongo)
    else:
        file_parse(file)
# End main

if __name__ == "__main__":
    main()
