
# TUF Metadata Visualizer  

A simple web application to visualize TUF (The Update Framework) metadata. The frontend is built with React, while the backend is powered by Flask.  

## Features  
- Lists all available TUF metadata files.  
- Expands JSON content on click for better readability.  
- Fetches data from a Flask backend API.  

## Tech Stack  
- **Frontend:** React (useState, useEffect, Fetch API)  
- **Backend:** Flask, Flask-CORS  
- **Styling:** Basic inline CSS  

## Installation and Setup  

### Backend (Flask)  

1. Clone the repository:  
   ```sh
   git clone https://github.com/your-username/tuf-visualizer.git
   cd tuf-visualizer/backend
   ```  
2. Create a virtual environment and activate it:  
   ```sh
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```  
3. Install dependencies:  
   ```sh
   pip install flask flask-cors
   ```  
4. Run the Flask server:  
   ```sh
   python app.py
   ```  
   The server will start at `http://127.0.0.1:5000`.

### Frontend (React)  

1. Open a new terminal and navigate to the frontend directory:  
   ```sh
   cd ../frontend
   ```  
2. Install dependencies:  
   ```sh
   npm install
   ```  
3. Start the React development server:  
   ```sh
   npm start
   ```  
   The app will run at `http://localhost:3000`.

## Usage  
- Open `http://localhost:3000` in your browser.  
- Click on any file name to expand and view its JSON content.  




![image](https://github.com/user-attachments/assets/accf63a5-4fdf-4cc4-b713-c185fcbac4d0)

![image](https://github.com/user-attachments/assets/6cd16a34-24d3-4b3f-892c-40624fac89cf)

