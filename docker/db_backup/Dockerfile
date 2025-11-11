FROM ubuntu:latest

RUN apt update && apt install -y gnupg wget apt-transport-https lsb-release cron dos2unix

RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list

RUN apt update && apt install -y postgresql-client-17
RUN rm -rf /var/lib/apt/lists/*

COPY cron.tab /etc/cron.d/cron.tab
RUN dos2unix /etc/cron.d/cron.tab
RUN chmod 0644 /etc/cron.d/cron.tab
RUN mkdir -p /var/log/cron
RUN touch /var/log/cron/backup.log

RUN crontab /etc/cron.d/cron.tab

CMD cron && tail -f /var/log/cron/backup.log
