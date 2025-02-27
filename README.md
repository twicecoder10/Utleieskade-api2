# Utleieskade Backend API

A Node.js backend built with **Express.js**, **MySQL**, and **Sequelize** for managing rental damage maintenance.

## Features

- User authentication (JWT)
- CRUD operations for users, cases, and inspections
- Sequelize ORM for database interactions
- Express middleware for validation and error handling
- Secure password storage with bcrypt
- API request logging with Morgan

## Project Structure

📦 src
┣ 📂 config
┃ ┣ 📜 db.js # Database connection using Sequelize
┃ ┣ 📜 env.js # Load environment variables
┣ 📂 controllers # Business logic
┣ 📂 middlewares # Middlewares (auth, error handling, validation)
┣ 📂 models # Sequelize Models
┣ 📂 routes # Express routes
┣ 📂 services # Logic layer
┣ 📂 utils # Utility functions
┣ 📂 validators # Request validation
┣ 📜 app.js # Express application setup
┣ 📜 server.js # Server entry point
┣ 📜 .env # Environment variables
┣ 📜 package.json # Dependencies and scripts
┣ 📜 README.md # Documentation

## Installation

### Prerequisites

- Node.js (>= 14.x)
- MySQL (MariaDB)
- npm

### Setup

1. Clone the repository

   ```sh
   git clone https://github.com/twicecoder10/Utleieskade-api.git
   cd Utleieskade-api

   ```

2. Install dependencies
   npm install

3. Create a .env file with using the env.example file as a guide

4. Sync Your DB:
   npm run sync-db or npm run sync-db -- --force (for a force sync)

5. Seed/Populate Your Database
   npm run seed-db

6. Run the development server:
   npm run dev

### API Endpoints

---

### Authentication

    •	JWT authentication is required for protected routes.
    •	Send Authorization: Bearer <token> in the headers.

### Future Enhancements

---

## API Documentation

The API is documented using **Swagger**. See the table below for web socket docs.

| **Event Name**   | **Description**                                 | **Example Request Payload**                                                                    |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `sendMessage`    | Sends a real-time message to another user.      | `{ "receiverId": "user-123", "messageText": "Hello!" }`                                        |
| `receiveMessage` | Listens for new incoming messages.              | `{ "senderId": "user-456", "messageText": "Hey there!", "timestamp": "2025-02-27T12:00:00Z" }` |
| `markAsRead`     | Marks messages in a conversation as read.       | `{ "conversationId": "conv-789", "userId": "user-123" }`                                       |
| `disconnect`     | Disconnects the user from the WebSocket server. | `{}`                                                                                           |

### 📌 Access Swagger UI:

- **Local Development:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

### 📌 Example Endpoints:

- `POST /users/login` → Login to get authenticated
- `POST /users/signup` → Create a new user
