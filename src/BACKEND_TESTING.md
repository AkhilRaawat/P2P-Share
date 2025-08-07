# Backend API Testing Guide

## Testing the Java Backend Server

When you see "Not Found" at http://localhost:8080, that's NORMAL! 
The backend only responds to specific API endpoints, not the root URL.

## Available API Endpoints:

### 1. Upload Endpoint
- **URL**: `POST http://localhost:8080/upload`
- **Purpose**: Upload a file and get a port number for sharing
- **Content-Type**: `multipart/form-data`

### 2. Download Endpoint  
- **URL**: `GET http://localhost:8080/download/{port}`
- **Purpose**: Download a file using the port number
- **Example**: `GET http://localhost:8080/download/12345`

## Testing Methods:

### Method 1: Use the Frontend (Easiest)
1. Run `start-app.bat`
2. Go to http://localhost:3000
3. Upload/download files through the UI

### Method 2: Use curl commands
```bash
# Test upload (replace 'test.txt' with an actual file)
curl -X POST -F "file=@test.txt" http://localhost:8080/upload

# Test download (replace 12345 with actual port from upload response)
curl -X GET http://localhost:8080/download/12345 --output downloaded-file
```

### Method 3: Use Postman/Insomnia
1. **Upload Test**:
   - Method: POST
   - URL: http://localhost:8080/upload
   - Body: form-data
   - Key: "file" (type: File)
   - Value: Select any file

2. **Download Test**:
   - Method: GET  
   - URL: http://localhost:8080/download/{port-from-upload-response}

## Expected Responses:

### Upload Success:
```json
{
  "port": 45678
}
```

### Upload Error:
```
Bad Request: Content-Type must be multipart/form-data
```

### Download Success:
- File downloads with proper filename

### Download Error:
```
Error downloading file: Connection refused
```

## Server Status Check:

### ✅ Server Running Correctly:
- "Not Found" at http://localhost:8080/ (this is normal!)
- Upload endpoint works: `POST /upload`
- Download endpoint works: `GET /download/{port}`

### ❌ Server Not Running:
- Browser shows "This site can't be reached"
- Connection refused errors

## Troubleshooting:

1. **"Not Found" is NORMAL** - the server is running correctly
2. **Test actual endpoints** instead of the root URL
3. **Use the frontend** at http://localhost:3000 for the best experience
