<div align="center">
  <img src="/logo.png" alt="Ditanyain Back-End" width="160" />

# Ditanyain Back-End

</div>

## ❓ About This Project

**Ditanyain Back-End** is the server-side application for the Ditanyain platform.  
This repository contains the **back-end logic, API endpoints, and database interactions** for Ditanyain’s formative assessment system.  

It powers **real-time feedback, user management, quiz management, and administrator features** that the front-end consumes.


> ⚠️ **Repository Notice**  
> This repository is a **sanitized copy** of Ditanyain Back-End codebase. Some internal logic, configuration, and data have been adjusted or removed to **maintain the confidentiality of internal company data**.

## 💻 Built With

<img src="https://skillicons.dev/icons?i=nodejs,typescript,express,postgres,rabbitmq" height="48">

- **Node.js & TypeScript** – main server runtime and language  
- **Express.js** – HTTP server framework  
- **PostgreSQL** – relational database for storing users, quizzes, and results  
- **RabbitMQ** – async processing for **question generation by LLM** 

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v22 recommended)  
- [PostgreSQL](https://www.postgresql.org/)  
- [RabbitMQ](https://www.rabbitmq.com/)  

---

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/Ditanyain/open-backend.git
   cd open-backend

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables

   Create a `.env` file in the project root and fill it with:

   ```
    # APP
    HOST=localhost
    PORT=5000
    CORS_ORIGIN=http://localhost:3000,https://myfrontend.com
    
    # LLM
    LLM_BASE_URL=https://api.llm.com
    LLM_API_KEY=YOUR_LLM_API_KEY
    LLM_MODEL=LLM_MODEL
    
    # LMS
    LMS_API_BASE_URL=http://lms.com/api
    
    # POSTGRESQL
    DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST
    
    # RABBITMQ
    RABBITMQ_SERVER=amqp://YOUR_RABBITMQ_SERVER
    
    # JWT TOKEN
    ACCESS_TOKEN_SECRET=YOUR_ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET=YOUR_REFRESH_TOKEN_SECRET
   ```
5. GeoLite2 Database Setup

   This application requires an IP Geolocation database. Please download the `.mmdb` file and place it in the configuration folder.
   
   - **Download File:** [GeoLite2-City.mmdb](https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb)
   - **Save Location:** `src/config/GeoLiteDB/GeoLite2-City.mmdb`
   
   > **Note:** The GeoLite2 database is updated periodically. It is recommended to re-download this file regularly to ensure accurate geolocation data.
   

6. Run database migrations (if applicable)

   ```bash
   npm run migrate
   ```

7. Start the server

   ```bash
   npm run dev
   ```

Your server should now be running on `http://localhost:5000` by default.

> **Note:** For production, make sure your back-end is deployed with a proper **SSL certificate**, and environment variables are secured.

## 👥 Contributors

<p>
    <a href="https://github.com/gbagush"><img src="https://github.com/gbagush.png" width="48" /></a>&nbsp;&nbsp;
    <a href="https://github.com/Dziqha"><img src="https://github.com/Dziqha.png" width="48" /></a>
</p>
