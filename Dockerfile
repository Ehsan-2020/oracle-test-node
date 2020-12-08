FROM registry.access.redhat.com/ubi8/nodejs-12:1-59
USER root
RUN yum upgrade --disableplugin=subscription-manager -y
EXPOSE 8080
CMD ["/bin/bash"]