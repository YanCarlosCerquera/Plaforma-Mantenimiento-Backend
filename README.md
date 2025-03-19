## Running the Project with Docker

To run this project using Docker, follow these steps:

1. **Ensure Docker and Docker Compose are installed**:
   - Docker version: Ensure you have Docker installed (version 20 or later).
   - Docker Compose: Ensure Docker Compose is available (version 1.29 or later).

2. **Set up environment variables**:
   - Create a `.env.production` file in the root directory if it doesn't exist.
   - Define the necessary environment variables as required by the application.

3. **Build and start the services**:
   ```bash
   docker-compose up --build
   ```
   This command builds the Docker images and starts the services defined in the `docker-compose.yml` file.

4. **Access the application**:
   - The application will be available at `http://localhost:3000`.
   - The database service is exposed internally within the Docker network.

5. **Stop the services**:
   ```bash
   docker-compose down
   ```
   This command stops and removes the containers created by Docker Compose.

For further details, refer to the `docker-compose.yml` and `Dockerfile` files in the project repository.