# SoundShift

### Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - App name: "SoundShift"
   - Website: http://localhost:3000
   - Redirect URI: http://localhost:3000/callback
4. Add your Client ID and Client Secret to the backend `.env` file

### Backend Setup
1. Create and activate virtual environment:
```
cd backend
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```
pip3 install -r requirements.txt
```

3. Create a `.env` file in the backend directory with the following variables:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_env
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
2. Open a frontend terminal
```
cd frontend
npm run dev
```