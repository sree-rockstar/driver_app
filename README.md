# Driver App - Full Stack Template

A modern full-stack application with FastAPI backend, MongoDB database, and React PWA frontend. Includes both user and admin panels with JWT authentication.

## 🚀 Features

### Backend (FastAPI + MongoDB)
- ✅ RESTful API with FastAPI
- ✅ MongoDB database with Motor (async driver)
- ✅ JWT authentication and authorization
- ✅ Role-based access control (Admin, User, Driver)
- ✅ Pydantic models for data validation
- ✅ CORS middleware configured
- ✅ API documentation (Swagger/OpenAPI)
- ✅ User management endpoints
- ✅ Driver management endpoints
- ✅ Admin panel endpoints

### Frontend (React + TypeScript + PWA)
- ✅ Progressive Web App (PWA) support
- ✅ Built with React 18 + TypeScript
- ✅ Vite for fast development and building
- ✅ TailwindCSS for styling
- ✅ React Router for navigation
- ✅ Zustand for state management
- ✅ React Query for API calls
- ✅ Responsive design (mobile & desktop)
- ✅ Separate User and Admin dashboards
- ✅ JWT authentication flow
- ✅ Protected routes

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- MongoDB 7.0+
- Docker & Docker Compose (optional)

## 🛠️ Installation & Setup

### Option 1: Using Docker (Recommended)

1. **Clone and navigate to the project:**
```bash
cd driver_app
```

2. **Start all services with Docker Compose:**
```bash
docker-compose up -d
```

This will start:
- MongoDB on `localhost:27017`
- Backend API on `http://localhost:8000`
- Frontend on `http://localhost:5173`

3. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
The `.env` file is already created with default values. Update if needed:
```bash
# Edit backend/.env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=driver_app
SECRET_KEY=your-secret-key-change-in-production
```

5. **Start MongoDB:**
Make sure MongoDB is running on `localhost:27017`

6. **Run the backend server:**
```bash
python run.py
# Or
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

#### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
The `.env` file is already created. Update if needed:
```bash
# Edit frontend/.env
VITE_API_URL=http://localhost:8000/api/v1
```

4. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📱 Using the Application

### First Time Setup

1. **Register an Admin Account:**

Since the first user should be an admin, you'll need to either:

**Option A: Using the API directly**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

**Option B: Using the Swagger UI**
- Go to http://localhost:8000/docs
- Use the `/api/v1/auth/register` endpoint
- Set `role` to `"admin"`

2. **Login:**
- Go to http://localhost:5173/login
- Use your credentials to login
- Admins will be redirected to `/admin`
- Regular users will be redirected to `/dashboard`

### User Roles

- **Admin**: Full access to admin panel, can manage users and drivers
- **User**: Access to user dashboard
- **Driver**: Can create driver profiles and manage trips

## 🎯 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

### Drivers
- `POST /api/v1/drivers` - Create driver profile
- `GET /api/v1/drivers` - List all drivers
- `GET /api/v1/drivers/{id}` - Get driver by ID
- `PUT /api/v1/drivers/{id}` - Update driver

### Admin (Admin only)
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/users/{id}` - Get user by ID
- `DELETE /api/v1/admin/users/{id}` - Delete user
- `PUT /api/v1/admin/users/{id}/activate` - Activate user
- `PUT /api/v1/admin/users/{id}/deactivate` - Deactivate user
- `GET /api/v1/admin/stats` - Get application statistics

## 📁 Project Structure

```
driver_app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # Dependencies (auth)
│   │   │   └── v1/
│   │   │       ├── api.py           # API router
│   │   │       └── endpoints/       # API endpoints
│   │   │           ├── auth.py
│   │   │           ├── users.py
│   │   │           ├── drivers.py
│   │   │           └── admin.py
│   │   ├── core/
│   │   │   ├── config.py            # Configuration
│   │   │   └── security.py          # Security utilities
│   │   ├── db/
│   │   │   └── mongodb.py           # Database connection
│   │   ├── models/
│   │   │   ├── user.py              # User models
│   │   │   └── driver.py            # Driver models
│   │   └── main.py                  # FastAPI app
│   ├── requirements.txt
│   ├── run.py
│   ├── .env
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── lib/
│   │   │   └── api.ts               # API client
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   └── Drivers.tsx
│   │   │   └── user/
│   │   │       └── Dashboard.tsx
│   │   ├── store/
│   │   │   └── authStore.ts         # Auth state management
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔐 Security Notes

1. **Change the SECRET_KEY** in production:
```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"
```

2. **Update CORS origins** for production in `backend/.env`

3. **Use HTTPS** in production

4. **Set DEBUG=False** in production

## 🎨 Customization

### Adding New Features

1. **Backend**: Add new endpoints in `backend/app/api/v1/endpoints/`
2. **Frontend**: Add new pages in `frontend/src/pages/`
3. **Models**: Define new models in `backend/app/models/`

### Styling

- The app uses TailwindCSS
- Customize colors in `frontend/tailwind.config.js`
- Global styles in `frontend/src/index.css`

## 📦 Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run preview  # Test production build
```

The build files will be in `frontend/dist/`

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build

# Stop and remove volumes (deletes data)
docker-compose down -v
```

## 🤝 Contributing

Feel free to customize this template for your needs!

## 📄 License

This is a template project - use it however you'd like!

## 🆘 Troubleshooting

### Backend Issues

1. **ModuleNotFoundError**: Make sure virtual environment is activated and dependencies are installed
2. **MongoDB connection error**: Ensure MongoDB is running on the correct port
3. **CORS errors**: Check `ALLOWED_ORIGINS` in `.env`

### Frontend Issues

1. **API connection errors**: Check `VITE_API_URL` in `.env`
2. **Build errors**: Delete `node_modules` and run `npm install` again
3. **PWA not working**: PWA only works in production build or HTTPS

### Docker Issues

1. **Port already in use**: Change ports in `docker-compose.yml`
2. **Container won't start**: Check logs with `docker-compose logs [service-name]`

## 📞 Support

For issues or questions, please check the documentation or create an issue.

---

**Happy Coding! 🚀**
