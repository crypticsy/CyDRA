## CyDRA: Risk Assessment in Transactions under Security Threats

<a href="https://raw.githubusercontent.com/crypticsy/CyDRA/main/docker-compose.yaml" download>
    <img src="https://img.shields.io/badge/Download-Dockerfile-blue?style=for-the-badge&logo=docker" alt="Download Dockerfile">
</a>

### Prerequisites

Before you start, ensure you have the following installed:

#### 1. Docker
- Install Docker: [Get Docker](https://docs.docker.com/get-docker/)
- Includes Docker Engine and Docker CLI.

#### 2. Docker Compose
- Bundled with Docker Desktop (Mac/Windows).
- On Linux, install it using:
  ```sh
  sudo apt-get install docker-compose-plugin
  ```

---

### Running the CyDRA Application

#### 1. Clone the Repository

Clone the project and navigate into it:

```sh
git clone https://github.com/sowinskw/cydra-docker.git
cd cydra-docker
```

Ensure the project contains:

```
project-root/
├── docker-compose.yaml
```

#### 2. Pull Docker Images

The `docker-compose.yaml` file is configured to pull the latest backend and frontend images automatically:
- `sowinskw/cydra-backend:latest`
- `sowinskw/cydra-frontend:latest`

No manual builds required!

#### 3. Start the Application

Run the following command in the project root directory:

```sh
docker-compose up -d
```

This command:
- Pulls the latest backend and frontend images (if not already present).
- Starts both services in **detached mode** (`-d`).
- Exposes the following ports:
  - Backend: `http://localhost:8080`
  - Frontend: `http://localhost:5173`

#### 4. Verify Running Containers

Check if the containers are running:

```sh
docker-compose ps
```

Expected output:

```
Name               Command               State           Ports
---------------------------------------------------------------------
cydra-backend    python app.py              Up      0.0.0.0:8080->8080/tcp
cydra-frontend   yarn dev --host 0.0.0.0    Up      0.0.0.0:5173->5173/tcp
```

#### 5. Access the Application

- **Frontend (UI):** [http://localhost:5173](http://localhost:5173)
- **Backend (API):** [http://localhost:8080](http://localhost:8080)

#### 6. Stop the Application

To stop all running containers:

```sh
docker-compose down
```

---

### Additional Commands

#### View Logs
To view logs for a specific container:

```sh
docker-compose logs -f backend
```
```sh
docker-compose logs -f frontend
```

#### Clean Up Docker Resources
To remove all containers, images, and volumes:

```sh
docker-compose down --volumes --rmi all
```


