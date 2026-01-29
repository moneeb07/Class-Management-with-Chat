# Class Management System (MERN Stack)

This is a comprehensive Learning Management System (LMS) application built with the MERN stack (MongoDB, Express, React, Node.js). It provides role-based access for Faculty and Students, allowing for course management, assignment creation, student enrollment, and submission handling.

## 🚀 Features

### Authentication & Roles
*   **Role-Based Access Control (RBAC):** Distinct dashboards and features for Faculty and Students.
*   **Secure Authentication:** JWT-based authentication with secure cookie storage.

### Faculty Features
*   **Class Management:** Create, update, and manage classes.
*   **Assignment Creation:** Create various types of assignments (Coding, Writing, etc.) with due dates and grading criteria.
*   **Student Management:** View enrolled students and manage class rosters.
*   **Grading:** (Future implementation) Grade student submissions.
*   **Dashboard:** Overview of active classes and recent activity.

### Student Features
*   **Join Classes:** Enrol in classes using a unique 6-digit enrollment key.
*   **Assignment Submission:** Submit works for assignments (supports file uploads).
*   **Dashboard:** View enrolled classes and upcoming deadlines.
*   **Progress Tracking:** View grades and feedback.

## 🛠️ Tech Stack

### Client (Frontend)
*   **Framework:** React (Vite)
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **State Management & Data Fetching:** React Query (TanStack Query)
*   **Routing:** React Router DOM
*   **Forms:** React Hook Form + Zod Validation
*   **HTTP Client:** Axios

### Server (Backend)
*   **Environment:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT), Bcrypt.js
*   **File Handling:** Multer (for uploads)
*   **Security:** Helmet, CORS, Express Rate Limit, Express Validator

## 📂 Project Structure

```
eval-ai/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # API service layer
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Feature-specific components
│   │   ├── hooks/          # Custom React hooks
│   │   └── pages/          # Application pages (Auth, Faculty, Student, Shared)
│   └── ...
├── server/                 # Node.js Backend
│   ├── controllers/        # Request handlers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware (Auth, Validation)
│   └── ...
└── README.md
```

## ⚡ Getting Started

### Prerequisites
*   Node.js (v14+ recommended)
*   MongoDB (Local or Atlas connection string)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/moneeb07/Class-Management-with-Chat.git
    cd Class-Management-with-Chat
    ```

2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

### Configuration

1.  **Server .env:**
    Create a `.env` file in the `server` directory with the following variables:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/eval-ai
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRE=30d
    NODE_ENV=development
    ```

2.  **Client Configuration:**
    Ensure the client API base URL matches your server port (default is usually set to `http://localhost:5000/api`).

### Running the Application

1.  **Start the Backend:**
    ```bash
    # In /server directory
    npm start
    ```

2.  **Start the Frontend:**
    ```bash
    # In /client directory
    npm run dev
    ```

3.  Access the application at `http://localhost:5173` (or the port shown in your terminal).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
