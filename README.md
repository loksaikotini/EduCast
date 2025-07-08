# EduCast: The All-in-One Virtual Classroom Platform

<div align="center">
 
  <img src="dashboard.png" alt="EduCast Dashboard Screenshot" width="800"/>
</div>

<br/>

**Live Application Link:** [https://educast-app.onrender.com](https://educast-app.onrender.com)

## Description

EduCast is a full-stack, real-time web application designed to provide a seamless and interactive virtual learning experience. It empowers teachers to create and manage persistent digital classrooms, while students can easily join and participate in a rich, collaborative environment.

The platform is built on a modern technology stack, including Node.js, Express, React, MongoDB, and Socket.IO, ensuring a robust and scalable foundation. It features real-time chat, persistent material sharing, and a high-performance, low-latency video conferencing module built with WebRTC. This allows for direct peer-to-peer video connections, minimizing server load and providing crystal-clear communication.

## Features

- **Dual User Roles:** Secure registration and login for both **Teachers** and **Students**, with role-based dashboards and permissions.
- **Persistent Classrooms:** Teachers can create classrooms with unique join codes. These classrooms save materials and chat history.
- **Real-Time Classroom Chat:** A dedicated, room-based chat for each classroom, powered by Socket.IO, allowing for instant communication between members.
- **Material & File Sharing:** All members can upload and download class materials (PDFs, images, etc.), which are stored securely and associated with the specific classroom.
- **Live Video Conferencing:**
  - Teachers can launch spontaneous, secure video meetings with a single click.
  - Students can join active meetings using a unique meeting code.
  - Built with **WebRTC (via Simple-Peer)** for high-quality, low-latency, peer-to-peer video and audio.
- **Interactive Meeting Features:**
  - **Screen Sharing:** Present your screen to all participants.
  - **Collaborative Whiteboard:** A shared, real-time whiteboard powered by `tldraw` allows for interactive drawing and brainstorming.
  - **In-Meeting Controls:** Mute/unmute, start/stop video, raise hand, and a real-time participants list.
  - **In-Meeting Chat:** A dedicated chat for the live video session.

## Tools and Technologies

### Backend
- **Node.js & Express.js:** For building the robust REST API and server-side logic.
- **MongoDB & Mongoose:** As the primary database for storing user, classroom, and material data.
- **Socket.IO:** For enabling all real-time functionalities, including classroom chat, meeting signals, and the collaborative whiteboard.
- **WebRTC (via Simple-Peer):** The core technology for establishing direct peer-to-peer video and audio streams, ensuring low latency.
- **JSON Web Tokens (JWT):** For secure, stateless user authentication and protected routes.
- **Multer:** For handling multipart/form-data, primarily used for file uploads.
- **Dotenv:** For managing environment variables.

### Frontend
- **React.js & Vite:** For building a fast, modern, and responsive user interface.
- **React Router:** For client-side routing and navigation.
- **Socket.IO Client:** To connect to the backend and handle real-time events.
- **Tailwind CSS:** For rapid, utility-first styling.
- **`tldraw`:** A powerful open-source library for the collaborative whiteboard feature.
- **React Icons:** For a clean and consistent icon set.

### Deployment
- **Render:** The all-in-one platform used for deploying the Node.js web service, the React static site, and managing environment variables.
- **MongoDB Atlas:** The cloud-hosted, fully-managed MongoDB database.
- **Git & GitHub:** For version control and enabling the Continuous Deployment pipeline.

## Installation and Setup Guide

To run this project locally, follow these steps:

1.  **Prerequisites:**
    - Ensure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/try/download/community) installed on your system.
    - Clone the repository: `git clone https://github.com/loksaikotini/EduCast.git`

2.  **Backend Setup:**
    - Navigate to the server directory: `cd EduCast/server`
    - Install dependencies: `npm install`
    - Create a `.env` file in the `server` directory and add the following variables:
      ```env
      PORT=5000
      MONGO_URI=mongodb://127.0.0.1:27017/educast
      JWT_SECRET=a_long_random_secret_string_for_local_dev
      FRONTEND_URL=http://localhost:5173
      ```
    - Start the backend server: `npm start`

3.  **Frontend Setup:**
    - Open a new terminal and navigate to the client directory: `cd EduCast/client`
    - Install dependencies: `npm install`
    - Create a `.env` file in the `client` directory and add the following variables:
      ```env
      VITE_API_URL=http://localhost:5000/api
      VITE_SOCKET_URL=http://localhost:5000
      ```
    - Start the frontend development server: `npm run dev`

4.  **Access the Application:**
    - Open your browser and go to `http://localhost:5173`.

## Further Development

This project provides a solid foundation that can be extended with many exciting features:
- **Scheduled Meetings:** Allow teachers to schedule video classes in advance, which then appear on a calendar for students.
- **Recording Meetings:** Integrate a server-side recording feature for video sessions.
- **Private Messaging:** Allow direct, one-to-one messaging between users within a classroom.
