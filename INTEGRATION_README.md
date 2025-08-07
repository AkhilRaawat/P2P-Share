# P2P FileSharer - Frontend-Backend Integration Guide

## Overview
This P2P FileSharer application consists of:
- **Backend**: Java application (Port 8080) handling file upload/download
- **Frontend**: Next.js React application (Port 3000) providing the user interface

## How to Run the Application

### Method 1: Using Batch Scripts (Windows)

#### Option A: Full Application (Both Frontend + Backend)
1. **Basic launcher**: Double-click `start-app.bat`
2. **Advanced launcher**: Double-click `start-app-advanced.bat` (recommended)
   - Better UI and control options
   - Press ENTER to stop Java backend
   - Frontend continues running independently

#### Option B: Backend Only
1. Double-click `start-backend-only.bat`
2. Press ENTER anytime to stop the Java server

### Method 2: Manual Start

#### 1. Start the Backend (Java Server)
```bash
# Navigate to the Java project directory
cd "src/p2p shareit"

# Compile and run the application
mvn clean compile exec:java
```

**Alternative methods:**
```bash
# Method 1: Using Maven exec plugin (recommended)
mvn exec:java

# Method 2: Using java command directly
mvn compile
java -cp target/classes akhil.shareit.App
```

#### 2. Start the Frontend (Next.js)
```bash
# Navigate to the UI directory
cd ui

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

## How the Integration Works

### API Endpoints
The Java backend provides these REST endpoints:

1. **POST /upload**
   - Accepts multipart/form-data file uploads
   - Returns JSON: `{"port": 12345}` where the port is used as a sharing code
   
2. **GET /download/{port}**
   - Downloads file using the port number as identifier
   - Returns the file as a blob with proper headers

### Frontend Integration
The frontend now uses real API calls instead of mock functions:

1. **File Upload**: 
   - Uses `uploadFile()` function from `/src/lib/api.ts`
   - Shows real upload progress
   - Returns actual port number for sharing

2. **File Download**:
   - Uses `downloadFile()` function from `/src/lib/api.ts` 
   - Shows real download progress
   - Automatically downloads the file to user's computer

### Key Features
- ✅ Real file upload with progress tracking
- ✅ Real file download with progress tracking  
- ✅ CORS properly configured for cross-origin requests
- ✅ Error handling for network issues
- ✅ Server status checking
- ✅ Automatic file download triggering

## Testing the Integration

### Upload a File:
1. Go to http://localhost:3000
2. Click "Share" tab
3. Drag & drop a file or click to select
4. Click "Share File"
5. You'll get a port number (e.g., 45678)

### Download the File:
1. Click "Receive" tab  
2. Enter the port number you got from upload
3. Click "Download File"
4. The file will automatically download to your computer

## Troubleshooting

### "Backend server is not running" Error
- Make sure the Java application is running on port 8080
- Check that no firewall is blocking the connection
- Verify Maven dependencies are installed

### CORS Errors
- The backend includes CORS headers for `localhost:3000`
- If using a different port, update the CORS configuration in `FileController.java`

### Network Errors
- Ensure both servers are running
- Check that ports 3000 and 8080 are not blocked
- Try restarting both applications

## File Structure
```
P2P FileSharer/
├── src/p2p shareit/          # Java Backend
│   ├── src/main/java/        # Java source code
│   └── pom.xml              # Maven dependencies
├── ui/                      # Next.js Frontend  
│   ├── src/
│   │   ├── app/page.tsx    # Main UI component
│   │   └── lib/api.ts      # API integration functions
│   └── package.json        # Node.js dependencies
├── start-app.bat           # Basic startup script
├── start-app-advanced.bat  # Advanced startup script (recommended)
├── start-backend-only.bat  # Backend-only script
└── INTEGRATION_README.md   # This file
```

## Development Notes
- The backend saves uploaded files to system temp directory
- Files are served directly via socket connections for P2P sharing
- The frontend uses Axios for HTTP requests with progress tracking
- All network communication uses standard HTTP protocols
