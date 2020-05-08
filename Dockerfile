FROM python:3.7.7-buster as builder
RUN apt-get install gnupg && wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add -
RUN echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.2 main" | tee /etc/apt/sources.list.d/mongodb-org-4.2.list
RUN apt-get update && apt-get install -y mongodb-org
RUN which mongorestore
RUN which mongodump

FROM python:3.7.7-buster  
COPY --from=builder /usr/bin/mongorestore /usr/bin/
COPY --from=builder /usr/bin/mongodump /usr/bin/
ENV PYTHONUNBUFFERED=1
COPY requirements.txt requirements.txt
COPY MongoBackup.py MongoBackup.py
RUN pip3 install -r requirements.txt
COPY credentials.env.txt credentials.txt
CMD ["python3","MongoBackup.py","--file=credentials.txt","-e"  ]
