# SoundShift

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

### Frontend Setup
1. Install dependencies:
```
cd frontend
npm install
npm start
```

### Running the server
1. Open a backend terminal
```
cd backend
uvicorn src.main:app --reload
```
2. Open a frontend terminal
```
cd frontend
npm start
```