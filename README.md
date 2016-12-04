# Shared Server

## Docker
To setup the Node.js and Postgres environments under a docker container you should first run the install-docker.sh script under the scripts folder. When all dependencies were installed, you should run these commands in a terminal:

```
sudo docker-compose build
sudo docker-compose up
```

This will create the containers where the Node.js and Postgres will be set up and will start the app.
If you want to stop the app then you should run this command in a new terminal tab:

```
sudo docker-compose stop
```

