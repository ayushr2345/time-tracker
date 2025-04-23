# Time Tracker
This is a small project made using NextJS, Express, MongoDB, and NodeJS - MERN Stack using ChatGPT AI.

## Use
I could never keep track of how much time I spend in various activities so I made this small project to keep track of how I spend my time. Yes excel could have helped but this is better for me. This can be up and running in a single command.

## Setup
To set this project up: <br/>
1. Clone this repo
2. cd into the frontend folder```cd frontend```
3. Install npm packages```npm install```
4. cd into backend folder```cd ../backend```
5. Install npm packages```npm install```
6. Create ```.env``` file in backend folder```touch .env```
7. Add two variables named ```PORT``` and ```MONGO_URI``` for your backend port and MongoDB url
8. Run your mongoDB server
9. Run the backend ```node server.js```
10. From another terminal, cd into frontend and start frontend ```npm run dev```

## Docker setup
To set this project in docker: <br/>
1. Clone this repo
2. cd into backend folder```cd ../backend```
3. Create ```.env``` file in backend folder```touch .env```
7. Add two variables named ```PORT``` and ```MONGO_URI``` for your backend port and MongoDB url
3. cd into the frontend folder```cd frontend```
4. Edit ```page.tsx``` to change the api URL to your machine's ip. Change the port which you have set in backend, mine was 5000.
5. Similarly make changes in ```docker-compose.yml``` file for port.
6. Build and run the docker container ```docker-compose up --build```

## Support for mongo backup and restore
There are two scripts, ```backup.sh``` and ```restore.sh``` in the project. Backup creates a backup of the mongo data (this way if you want to edit your backend or frontend, the data won't be lost). To restore, run the restore script when the mongo container is up and running.
