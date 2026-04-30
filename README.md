# TaskFlow — Project Management App

A full-stack project management application with role-based access control, task tracking, and team collaboration features.

## Live Demo
🔗 [your-app.up.railway.app](https://your-app.up.railway.app)

## Demo Video
🎥 [Watch Demo](https://your-video-link.com)

## Features

- **Authentication** — Secure signup/login with JWT tokens
- **Project Management** — Create projects, invite team members
- **Role-Based Access Control** — Admin and Member roles with different permissions
- **Task Tracking** — Create tasks, assign to members, set priority and due dates
- **Kanban Board** — Visual task management across TODO → IN PROGRESS → REVIEW → DONE
- **Task Filtering** — Filter by assignee, priority, overdue status, or search by name
- **Dashboard** — Overview of all tasks, overdue count, and personal assigned tasks
- **Analytics** — Charts showing task distribution by status, priority, and project
- **Profile Settings** — Update name and change password
- **Security** — Rate limiting, HTTP security headers via Helmet

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcryptjs for password hashing
- express-validator for input validation
- express-rate-limit + Helmet for security

### Frontend
- React 18 + Vite
- React Router v6
- Axios for API calls
- Recharts for analytics
- date-fns for date formatting

## Project Structure

```
project-manager/
├── backend/
│   ├── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       └── tasks.js
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx
        ├── api/
        │   └── client.js
        └── pages/
            ├── Dashboard.jsx
            ├── Projects.jsx
            ├── ProjectDetail.jsx
            ├── Analytics.jsx
            └── Profile.jsx
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update name or password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List my projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Admin) |
| POST | /api/projects/:id/members | Add member (Admin) |
| DELETE | /api/projects/:id/members/:userId | Remove member (Admin) |
| PUT | /api/projects/:id/members/:userId/role | Change member role (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks/dashboard | Get dashboard stats |
| GET | /api/tasks/my | Get my assigned tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task (Admin) |

## Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Delete project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Update any task | ✅ | ❌ |
| Update own task status | ✅ | ✅ |

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/project-manager.git
cd project-manager
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://YOUR_USER@localhost:5432/taskflow
JWT_SECRET=your-secret-key
PORT=4000
FRONTEND_URL=http://localhost:5173
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

Visit **http://localhost:5173**

## Deployment (Railway)

### Backend Service
- Root: `/backend`
- Build Command: `npm install && npx prisma generate && npx prisma db push`
- Start Command: `npm start`
- Add PostgreSQL plugin
- Environment variables: `JWT_SECRET`, `FRONTEND_URL`

### Frontend Service
- Root: `/frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx vite preview --port $PORT --host`
- Environment variable: `VITE_API_URL=https://your-backend.up.railway.app`

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT signing |
| PORT | Server port (default 4000) |
| FRONTEND_URL | Frontend URL for CORS |

### Frontend
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

## License
MIT
