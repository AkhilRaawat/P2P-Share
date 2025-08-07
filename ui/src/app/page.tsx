"use client";
import React, { useRef, useState, useEffect } from "react";
import { FiUploadCloud, FiDownloadCloud, FiFile, FiCheckCircle, FiCopy, FiImage, FiVideo, FiFileText, FiTrash2 } from "react-icons/fi";
import { uploadFile, downloadFile, checkServerStatus, getServerStatusDetails } from "@/lib/api";

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string>("");  // Add this to store the actual code
  const [receiveCode, setReceiveCode] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadCheck, setShowUploadCheck] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadCheck, setShowDownloadCheck] = useState(false);
  const [history, setHistory] = useState<Array<{ type: "share" | "download"; name: string; time: string }>>([]);
  const [tab, setTab] = useState<'share' | 'receive'>('share');
  const [copied, setCopied] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [receiverPassword, setReceiverPassword] = useState("");
  const [expiry, setExpiry] = useState("15"); // in minutes, default 15
  const [oneTime, setOneTime] = useState(false);
  const [codeUsed, setCodeUsed] = useState(false); // simulate for receiver
  const [codeExpired, setCodeExpired] = useState(false); // simulate for receiver
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const h = localStorage.getItem("p2p-history");
    if (h) setHistory(JSON.parse(h));
  }, []);

  // Save history to localStorage
  const addHistory = (entry: { type: "share" | "download"; name: string; time: string }) => {
    const newHistory = [entry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("p2p-history", JSON.stringify(newHistory));
  };

  // Clear history function
  const clearHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("p2p-history");
    setShowClearConfirm(false);
  };

  // Real upload handler using backend API
  const handleFileUpload = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);
    setUploadProgress(0);
    setShowUploadCheck(false);
    setShareCode("");  // Clear previous share code

    try {
      // Check if server is running with detailed info
      console.log('Checking backend server status...');
      const serverStatus = await getServerStatusDetails();
      console.log('Server status:', serverStatus);
      
      if (!serverStatus.isRunning) {
        throw new Error(`Backend server is not accessible. ${serverStatus.error || 'Please start the Java application on port 8080.'}`);
      }

      console.log('Backend server is running, proceeding with upload...');
      
      // Upload the first file (for multiple files, you'd need to upload each one)
      const file = selectedFiles[0];
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      setUploading(false);
      setShowUploadCheck(true);
      
      // Store the actual port number
      setShareCode(result.port.toString());
      
      setTimeout(() => {
        setShowUploadCheck(false);
        setUploadSuccess(`Files shared! Your code is: ${result.port}`);
        selectedFiles.forEach(file => {
          addHistory({ type: "share", name: file.name, time: new Date().toLocaleString() });
        });
      }, 1200);

    } catch (error) {
      setUploading(false);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      console.error('Upload error:', error);
    }
  };

  // Real download handler using backend API
  const handleFileDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveCode.trim()) {
      setDownloadError("Please enter a valid code");
      return;
    }

    setDownloading(true);
    setDownloadError(null);
    setDownloadProgress(0);
    setShowDownloadCheck(false);

    try {
      // Check if server is running
      const serverRunning = await checkServerStatus();
      if (!serverRunning) {
        throw new Error('Backend server is not running. Please start the Java application on port 8080.');
      }

      // Parse port from receiveCode (assuming receiveCode is the port number)
      const port = parseInt(receiveCode.trim());
      if (isNaN(port)) {
        throw new Error('Invalid code format. Please enter a valid port number.');
      }

      const result = await downloadFile(port, (progress) => {
        setDownloadProgress(progress.percentage);
      });

      setDownloading(false);
      setShowDownloadCheck(true);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setTimeout(() => {
        setShowDownloadCheck(false);
        addHistory({ type: "download", name: result.filename, time: new Date().toLocaleString() });
      }, 1200);

    } catch (error) {
      setDownloading(false);
      setDownloadError(error instanceof Error ? error.message : 'Download failed');
      console.error('Download error:', error);
    }
  };

  // Helper function to get file type icon/preview
  function getFilePreview(file: File) {
    const type = file.type;
    if (type.startsWith("image/")) {
      return <img src={URL.createObjectURL(file)} alt="preview" className="w-10 h-10 object-cover rounded shadow" />;
    }
    if (type.startsWith("video/")) {
      return <FiVideo className="text-2xl text-purple-400" title="Video file" />;
    }
    if (type === "application/pdf") {
      return <FiFileText className="text-2xl text-red-400" title="PDF file" />;
    }
    return <FiFile className="text-2xl text-primary-400" title="File" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-200">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary-700 mb-2 tracking-tight drop-shadow-lg">Shareit</h1>
        <p className="text-lg md:text-xl text-primary-900/70 font-medium">Share files instantly and securely, peer-to-peer.</p>
      </header>
      {/* Tab Toggle */}
      <div className="flex justify-center mb-8 gap-4">
        <button
          className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm border-2 ${tab === 'share' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'}`}
          onClick={() => setTab('share')}
        >
          <FiUploadCloud className="inline mr-2" /> Share a File
        </button>
        <button
          className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 shadow-sm border-2 ${tab === 'receive' ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'}`}
          onClick={() => setTab('receive')}
        >
          <FiDownloadCloud className="inline mr-2" /> Receive a File
        </button>
      </div>
      {/* Tab Content */}
      <div className="w-full max-w-xl">
        {tab === 'share' ? (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-primary-100 transition-all animate-fade-in">
            <FiUploadCloud className="text-5xl text-primary-500 mb-4 drop-shadow" />
            <h2 className="text-2xl font-semibold mb-2 text-primary-800">Share a File</h2>
            <p className="text-primary-700/70 mb-4 text-center">Drag and drop a file below or click to select. You’ll get a code to share with your friend.</p>
            <form onSubmit={handleFileUpload} className="w-full flex flex-col items-center">
              <div
                className={`w-full border-2 border-dashed rounded-xl p-6 mb-4 cursor-pointer transition-colors duration-200 ${selectedFiles.length > 0 ? "border-primary-500 bg-primary-50/60" : isDragActive ? "border-primary-400 bg-primary-200/60 shadow-lg scale-105" : "border-primary-200 bg-primary-100/40 hover:border-primary-400"}`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setSelectedFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                onDragOver={e => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragActive(false); }}
                onDragEnd={e => { e.preventDefault(); setIsDragActive(false); }}
              >
                <label htmlFor="file-upload" className="sr-only">Upload files</label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  multiple
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  title="Upload files"
                />
                {selectedFiles.length > 0 ? (
                  <span className="text-primary-700 font-medium">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</span>
                ) : (
                  <span className="text-primary-400">Click or drag files here</span>
                )}
              </div>
              {/* File previews */}
              {selectedFiles.length > 0 && (
                <div className="w-full flex flex-col gap-2 mb-4">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-primary-50/80 border border-primary-200 rounded-lg p-3 shadow-sm animate-fade-in">
                      {getFilePreview(file)}
                      <div className="flex-1">
                        <div className="font-medium text-primary-800 truncate">{file.name}</div>
                        <div className="text-xs text-primary-500">{(file.size / 1024 < 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / 1024 / 1024).toFixed(2) + ' MB')}</div>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-primary-400 hover:text-red-400 transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                        }}
                        title="Remove file"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Advanced Share Toggle */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 mb-2 rounded-xl bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold transition-colors focus:outline-none"
                onClick={() => setShowAdvanced(v => !v)}
                aria-expanded={showAdvanced}
              >
                <span>Advanced Share</span>
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {/* Advanced Share Section */}
              {showAdvanced && (
                <div className="w-full mb-4 p-4 rounded-xl bg-primary-50 border border-primary-200 animate-fade-in flex flex-col gap-2">
                  {/* Password protection */}
                  <div className="w-full flex items-center gap-2 mb-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="flex-1 border border-primary-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-primary-50/60 text-primary-900"
                      placeholder="Set password (optional)"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setRequirePassword(e.target.value.length > 0);
                      }}
                    />
                    <button
                      type="button"
                      className="px-2 py-2 rounded-xl bg-primary-100 hover:bg-primary-200 text-primary-700 font-semibold flex items-center gap-1 transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {/* Expiration timer and one-time download */}
                  <div className="w-full flex flex-col md:flex-row gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-xs text-primary-700 mb-1">Expiration</label>
                      <select
                        className="w-full border border-primary-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-primary-50/60 text-primary-900"
                        value={expiry}
                        onChange={e => setExpiry(e.target.value)}
                      >
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="1440">1 day</option>
                        <option value="0">No expiry</option>
                      </select>
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <label htmlFor="one-time" className="flex items-center cursor-pointer select-none">
                        <span className="text-primary-700 text-xs mr-3">One-time download</span>
                        <span className="relative">
                          <input
                            id="one-time"
                            type="checkbox"
                            className="sr-only peer"
                            checked={oneTime}
                            onChange={e => setOneTime(e.target.checked)}
                          />
                          <span className="block w-10 h-6 bg-primary-200 rounded-full peer-checked:bg-primary-600 transition-colors"></span>
                          <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 rounded-xl transition-colors duration-200 disabled:opacity-50 shadow flex items-center justify-center gap-2"
                disabled={selectedFiles.length === 0 || uploading}
              >
                {uploading ? (
                  <>
                    <span>Uploading...</span>
                  </>
                ) : showUploadCheck ? (
                  <FiCheckCircle className="text-green-500 animate-pop" />
                ) : (
                  "Share File"
                )}
              </button>
              {/* Upload progress bar */}
              {uploading && (
                <div className="w-full h-2 bg-primary-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {/* Upload checkmark animation */}
              {showUploadCheck && (
                <div className="flex items-center justify-center w-full mt-3 animate-fade-in">
                  <FiCheckCircle className="text-green-500 text-2xl animate-pop" />
                  <span className="ml-2 text-green-600 font-medium">Upload complete!</span>
                </div>
              )}
            </form>
            {/* Copyable code and QR code */}
            {uploadSuccess && (
              <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in">
                <div className="flex items-center gap-2 bg-primary-50/80 border border-primary-200 rounded-lg px-4 py-2">
                  <span className="font-mono text-primary-700 text-lg select-all">{shareCode}</span>
                  <button
                    className="ml-2 px-2 py-1 rounded bg-primary-200 hover:bg-primary-300 text-primary-800 font-semibold flex items-center gap-1 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(shareCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    }}
                    title="Copy code"
                  >
                    <FiCopy />
                    {copied ? <span className="text-green-600 font-medium">Copied!</span> : <span>Copy</span>}
                  </button>
                </div>
              </div>
            )}
            {uploadError && <div className="mt-4 text-red-600 font-medium animate-fade-in">{uploadError}</div>}
            {/* Simulate code expired/used for receiver */}
            {(codeExpired || codeUsed) && (
              <div className="w-full mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-center animate-fade-in">
                {codeExpired ? "This code has expired." : "This file/code has already been used for a one-time download."}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-primary-100 transition-all animate-fade-in">
            <FiDownloadCloud className="text-5xl text-primary-700 mb-4 drop-shadow" />
            <h2 className="text-2xl font-semibold mb-2 text-primary-800">Receive a File</h2>
            <p className="text-primary-700/70 mb-4 text-center">Enter the code you received to download the file directly from your peer.</p>
            <form onSubmit={handleFileDownload} className="w-full flex flex-col items-center">
              <div className="w-full flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter code"
                  className="flex-1 border border-primary-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-primary-50/60 text-primary-900"
                  value={receiveCode}
                  onChange={e => setReceiveCode(e.target.value)}
                  required
                />
              </div>
              {/* Password input for receiver, only if required */}
              {requirePassword && (
                <div className="w-full flex items-center gap-2 mb-4">
                  <input
                    type="password"
                    className="flex-1 border border-primary-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-primary-50/60 text-primary-900"
                    placeholder="Enter password"
                    value={receiverPassword}
                    onChange={e => setReceiverPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2 rounded-xl transition-colors duration-200 disabled:opacity-50 shadow flex items-center justify-center gap-2"
                disabled={downloading || !receiveCode}
              >
                {downloading ? (
                  <>
                    <span>Downloading...</span>
                  </>
                ) : showDownloadCheck ? (
                  <FiCheckCircle className="text-green-500 animate-pop" />
                ) : (
                  "Download File"
                )}
              </button>
              {/* Download progress bar */}
              {downloading && (
                <div className="w-full h-2 bg-primary-100 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-primary-700 transition-all duration-200"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
              {/* Download checkmark animation */}
              {showDownloadCheck && (
                <div className="flex items-center justify-center w-full mt-3 animate-fade-in">
                  <FiCheckCircle className="text-green-500 text-2xl animate-pop" />
                  <span className="ml-2 text-green-600 font-medium">Download started!</span>
                </div>
              )}
            </form>
            {downloadError && <div className="mt-4 text-red-600 font-medium animate-fade-in">{downloadError}</div>}
          </div>
        )}
      </div>
      {/* History section */}
      <div className="w-full max-w-2xl mt-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-primary-700">Recent Activity</h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors duration-200 font-medium"
            >
              <FiTrash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="text-primary-400">No recent activity.</div>
        ) : (
          <ul className="divide-y divide-primary-100 bg-white/60 rounded-xl shadow p-4">
            {history.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 py-2">
                <span className={`text-xl ${item.type === "share" ? "text-primary-500" : "text-primary-700"}`}>
                  {item.type === "share" ? <FiUploadCloud /> : <FiDownloadCloud />}
                </span>
                <span className="flex-1 truncate text-primary-900">{item.name}</span>
                <span className="text-xs text-primary-400 whitespace-nowrap">{item.time}</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-700 font-semibold">
                  {item.type === "share" ? "Shared" : "Downloaded"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear History</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to clear all activity history? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearHistory}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors duration-200 font-medium"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 text-primary-400 text-sm">&copy; {new Date().getFullYear()} Shareit. All rights reserved.</footer>
    </div>
  );
}