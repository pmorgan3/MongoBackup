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

def backup_mongo(conn_string, db_name, cols, access_key, secret_key):
    minioClient = Minio('play.min.io',
                    access_key='Q3AM3UQ867SPQQA43P2F',
                    secret_key='zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
                    secure=True)


def pairwise(iterable):
    """Returns every two elements in the given list """
    a = iter(iterable)
    return zip(a, a)

def file_parse(file):
    """Parses the given file (If applicable) """

    print("in file_parse")
    fp = open(file, 'r')

    # Allows for different formatting of the 
    # options
    connection_string_variants = ["connection", "connection_string", "conn"]
    db_name_variants = ["database", "name", "database_name", "db"]
    collections_variants = ["collections", "collection", "col"]
    access_variants = ["access_key", "access", "accesskey", "accessKey"]
    secret_variants = ["secret", "secret_key", "secretKey"]

    conn_string = None
    db = None
    col = None
    access = None
    secret = None
    
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

    backup_mongo(conn_string, db, col, access, secret)
    fp.close()

def main():
    argument_list = sys.argv[1:]
    short_options = "c:n:col:h:f:a:k"
    options = ["connection=", "name=", "db=", "collections=", "help", "file=", "accesskey=", "secret="]

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

    if file is None:
        backup_mongo(connection_string, database_name, collections, access_key, secret_key)
    else:
        file_parse(file)

