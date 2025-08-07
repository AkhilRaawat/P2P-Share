# TROUBLESHOOTING: "Backend server is not running" Error

## Quick Diagnosis Steps

### Step 1: Run the Backend Status Checker
```bash
# Double-click this file to check backend status
check-backend.bat
```

### Step 2: Manual Backend Status Check
1. Open Command Prompt
2. Run: `netstat -an | findstr ":8080"`
3. If you see `:8080` in the output, the server is running
4. If nothing appears, the server is NOT running

### Step 3: Test Backend Connection
Open your browser and go to: `http://localhost:8080`

**Expected Results:**
- ✅ **Server Running**: JSON response with server info
- ❌ **Server Not Running**: "This site can't be reached" or connection error

## Common Causes & Solutions

### 🔧 **Issue 1: Backend Server Not Started**
**Symptoms:** 
- No output from `netstat` command
- Browser shows "site can't be reached"

**Solution:**
```bash
# Method 1: Use batch script
start-app.bat

# Method 2: Manual start
cd "src\p2p shareit"
mvn exec:java
```

**Wait for this message:**
```
API server started on port 8080
Shareit server started on port 8080
```

### 🔧 **Issue 2: Maven Build Failed**
**Symptoms:**
- Maven shows "BUILD FAILURE"
- No server startup message

**Solution:**
```bash
cd "src\p2p shareit"
mvn clean compile
mvn exec:java
```

### 🔧 **Issue 3: Port 8080 Already in Use**
**Symptoms:**
- "Address already in use" error
- Another application is using port 8080

**Solution:**
```bash
# Find what's using port 8080
netstat -ano | findstr ":8080"

# Kill the process (replace PID with actual number)
taskkill /F /PID [PID_NUMBER]

# Or restart your computer
```

### 🔧 **Issue 4: Firewall Blocking Connection**
**Symptoms:**
- Backend starts successfully
- Browser can't connect
- Frontend shows connection error

**Solution:**
1. **Windows Firewall:**
   - Go to Windows Security → Firewall & network protection
   - Allow Java through firewall
   - Or temporarily disable firewall for testing

2. **Antivirus Software:**
   - Check if antivirus is blocking Java/Maven
   - Add exceptions for Java processes

### 🔧 **Issue 5: Wrong Java Version**
**Symptoms:**
- Maven compilation errors
- Unsupported class file version

**Solution:**
```bash
# Check Java version
java -version

# Should show Java 17 or higher
# If not, install correct Java version
```

### 🔧 **Issue 6: Dependencies Not Downloaded**
**Symptoms:**
- Import errors in logs
- Maven dependency resolution failed
- `NoClassDefFoundError: org/apache/commons/io/IOUtils`

**Solution:**
```bash
cd "src\p2p shareit"
mvn clean install
mvn dependency:resolve

# Alternative: Use the batch script that includes dependencies
start-backend.bat
```

### 🔧 **Issue 7: Downloaded Files Don't Have Original Names**
**Symptoms:**
- Files download as "downloaded-file" instead of original name
- Missing file extensions

**Solution:**
This is now **FIXED** in the current version. The system:
1. Preserves original filename and extension during upload
2. Transmits filename via DataOutputStream protocol
3. Sets proper Content-Disposition header
4. Frontend extracts and uses original filename

**Verification:**
- Upload a file like "document.pdf"
- Download should save as "document.pdf" with original name
- Check browser developer tools → Network tab → Response Headers
- Should see: `Content-Disposition: attachment; filename="document.pdf"`

## Step-by-Step Recovery Process

### 1. **Complete Reset**
```bash
# Stop all processes
taskkill /f /im java.exe
taskkill /f /im mvn.exe
taskkill /f /im node.exe

# Method 1: Use improved batch script (RECOMMENDED)
start-backend.bat

# Method 2: Manual start with dependencies
cd "src\p2p shareit"
mvn clean compile
java -cp "target/classes;C:\Users\%USERNAME%\.m2\repository\commons-io\commons-io\2.15.1\commons-io-2.15.1.jar" akhil.shareit.App
```

### 2. **Verify Backend is Working**
```bash
# Check port
netstat -an | findstr ":8080"

# Test connection
curl http://localhost:8080
```

### 3. **Start Frontend**
```bash
cd ui
npm run dev
```

## Debug Information Collection

If the issue persists, collect this information:

### Backend Logs:
```bash
cd "src\p2p shareit"
mvn exec:java > backend.log 2>&1
```

### Frontend Console:
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### System Information:
```bash
# Java version
java -version

# Node version  
node -v

# Port usage
netstat -an | findstr ":8080"
netstat -an | findstr ":3000"
```

## Expected Working State

When everything is working correctly:

1. **Backend Terminal:** Shows "API server started on port 8080"
2. **Browser Test:** `http://localhost:8080` returns JSON response
3. **Frontend:** No connection errors, upload/download works
4. **Network Tab:** Shows successful requests to localhost:8080

## Emergency Contacts

If all else fails:
1. Restart your computer
2. Check if Windows updates are pending
3. Temporarily disable antivirus/firewall
4. Try running as Administrator
