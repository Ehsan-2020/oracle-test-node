FROM registry.access.redhat.com/ubi8/nodejs-12:1-59
USER root
RUN echo 'Installing libaio package'
RUN yum install libaio -y
EXPOSE 8080
CMD ["sleep","infinity"]