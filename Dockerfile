FROM registry.access.redhat.com/ubi8/nodejs-12:1-59
USER root
RUN mkdir /project
WORKDIR /project
COPY *.js /project/
COPY *.json /project/
COPY *.rpm /project/
RUN npm install --unsafe-perm --production
RUN echo 'Installing libaio package'
RUN yum install libaio libnsl -y
RUN echo 'Installing the oracle rpm'
RUN rpm -i oracle-instantclient19.9-basiclite-19.9.0.0.0-1.x86_64.rpm
EXPOSE 3000
CMD ["npm","start"]