# SoundShift

## Requirements
- Python version >= 3.11
- Spotify API Client ID and Client Secret
- Gemini API Key

### Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - App name: "SoundShift"
   - Website: http://localhost:3000
   - Redirect URI: http://localhost:3000/callback
4. Add your Client ID and Client Secret to the backend `.env` file

### Gemini API Setup
1. Go to [Gemini API](https://console.cloud.google.com/gemini/apikey)
2. Create an API key
3. Add your API key to the backend `.env` file

### Backend Setup
1. Create and activate virtual environment:
```
cd backend
python3 -m venv venv
source venv/bin/activate
```
**Note:** On Windows use `venv\Scripts\activate`

- Make sure your Python interpreter is set to ./backend/venv/bin/python

2. Install dependencies:
```
pip3 install -r requirements.txt
```

3. Create a `.env` file in the backend directory with the following variables:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
GEMINI_API_KEY=your_gemini_key
```

### Frontend Setup
1. Install dependencies:
```
cd frontend
npm install
```

### Running the server
1. Open a backend terminal
```
cd backend
source venv/bin/activate
uvicorn src.main:app --reload
```
**Note:** On Windows use `venv\Scripts\activate`

2. Open a frontend terminal
```
cd frontend
npm run dev
```

### Troubleshooting
- Make sure you're running commands from the correct directories (backend/frontend)
- If you see a "Client ID loaded: False" message when running the backend, check that your `.env` file is in the correct location (/backend/.env). You might have to restart the backend terminal and recreate the `.env` file.
- Ensure Python 3.11 or higher is installed: `python --version`