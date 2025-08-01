# Thrust MVP

A full-stack application for AI-powered document analysis and presentation generation.

## Project Structure

```
thrust-mvp/
├── backend/          # FastAPI backend server
│   ├── app/         # Main application code
│   ├── requirements.txt
│   └── README.md
├── frontend/        # Next.js frontend application
│   ├── src/         # Source code
│   ├── public/      # Static assets
│   ├── package.json
│   └── README.md
└── README.md        # This file
```

## Features

- **Document Upload & Analysis**: Upload PDF documents for AI-powered analysis
- **AI Chat Interface**: Interactive chat with uploaded documents
- **Presentation Generation**: Automatically generate slide bullets and summaries
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **FastAPI Backend**: Python-based API with Supabase integration

## Environment Variables

The following environment variables need to be configured:

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Supabase account

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your Supabase credentials

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your environment variables

4. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:3000`
- API documentation available at `http://localhost:8000/docs`

## Deployment

The application is designed to be deployed with:
- Backend: Any Python hosting service (Railway, Heroku, etc.)
- Frontend: Vercel, Netlify, or similar
- Database: Supabase

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software. 