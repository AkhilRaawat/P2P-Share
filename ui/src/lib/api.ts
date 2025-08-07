import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8080';

// Configure axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
});

export interface UploadResponse {
  port: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a file to the backend
 * @param file - The file to upload
 * @param onProgress - Callback for upload progress updates
 * @returns Promise with the port number for sharing
 */
export const uploadFile = async (
  file: File, 
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage
          });
        }
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Upload error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Cannot connect to backend server. Please ensure the Java server is running on port 8080.');
      } else if (error.response?.status === 0) {
        throw new Error('Connection refused: Backend server may not be running or CORS issue.');
      } else {
        throw new Error(`Upload failed: ${error.response?.data || error.message}`);
      }
    }
    throw new Error('Upload failed: Unknown error');
  }
};

/**
 * Download a file using the port number
 * @param port - The port number received from upload
 * @param onProgress - Callback for download progress updates
 * @returns Promise with the downloaded file blob
 */
export const downloadFile = async (
  port: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const response = await api.get(`/download/${port}`, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage
          });
        }
      },
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'] || 
                              response.headers['Content-Disposition'];
    let filename = 'downloaded-file';
    
    console.log('All response headers:', response.headers);
    console.log('Content-Disposition header:', contentDisposition);
    
    if (contentDisposition) {
      // Try multiple patterns to extract filename
      let filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (!filenameMatch) {
        filenameMatch = contentDisposition.match(/filename=([^;]+)/);
      }
      if (!filenameMatch) {
        filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      }
      
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1].trim());
        console.log('Extracted filename:', filename);
      } else {
        console.log('Could not extract filename from Content-Disposition header');
      }
    } else {
      console.log('No Content-Disposition header found');
    }

    return {
      blob: response.data,
      filename
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Download failed: ${error.response?.data || error.message}`);
    }
    throw new Error('Download failed: Unknown error');
  }
};

/**
 * Check if the backend server is running
 * @returns Promise<boolean> - true if server is accessible
 */
export const checkServerStatus = async (): Promise<boolean> => {
  try {
    console.log('Checking backend server status...');
    const response = await api.get('/', { timeout: 5000 });
    console.log('Backend responded with status:', response.status);
    // Check if we get a response (any status 200-299)
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.log('Backend server check failed:', error);
    if (axios.isAxiosError(error)) {
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        status: error.response?.status
      });
    }
    return false;
  }
};

/**
 * Get detailed server status for debugging
 * @returns Promise with server status details
 */
export const getServerStatusDetails = async (): Promise<{
  isRunning: boolean;
  error?: string;
  response?: any;
}> => {
  try {
    const response = await api.get('/', { timeout: 5000 });
    return {
      isRunning: true,
      response: response.data
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        isRunning: false,
        error: `${error.code}: ${error.message}`
      };
    }
    return {
      isRunning: false,
      error: 'Unknown connection error'
    };
  }
};
