package akhil.shareit.service;

import akhil.shareit.utils.UploadUtils;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.HashMap;

public class FileSharer {

    private HashMap<Integer, String> availableFiles;

    public FileSharer() {
        availableFiles = new HashMap<>();
    }

    public int offerFile(String filePath) {
        int port;
        while (true) {
            port = UploadUtils.generateCode();
            if (!availableFiles.containsKey(port)) {
                availableFiles.put(port, filePath);
                return port;
            }
        }
    }

    public void startFileServer(int port) {
        String filePath = availableFiles.get(port);
        if (filePath == null) {
            System.err.println("No file associated with port: " + port);
            return;
        }

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Serving file '" + new File(filePath).getName() + "' on port " + port);
            Socket clientSocket = serverSocket.accept();
            System.out.println("Client connected: " + clientSocket.getInetAddress());

            new Thread(new FileSenderHandler(clientSocket, filePath)).start();

        } catch (IOException e) {
            System.err.println("Error starting file server on port " + port + ": " + e.getMessage());
        }
    }

    private static class FileSenderHandler implements Runnable {
        private final Socket clientSocket;
        private final String filePath;

        public FileSenderHandler(Socket clientSocket, String filePath) {
            this.clientSocket = clientSocket;
            this.filePath = filePath;
        }

        @Override
        public void run() {
            try (FileInputStream fis = new FileInputStream(filePath);
                 OutputStream oss = clientSocket.getOutputStream();
                 DataOutputStream dos = new DataOutputStream(oss)) {
                
                // Send the filename in a more robust way
                String fullFilename = new File(filePath).getName();
                String filename = fullFilename;
                
                // Remove UUID prefix if present (format: uuid_originalname.ext)
                if (fullFilename.contains("_") && fullFilename.length() > 37) {
                    // UUID is 36 characters + 1 underscore = 37 characters
                    String potentialUuid = fullFilename.substring(0, 36);
                    if (potentialUuid.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
                        filename = fullFilename.substring(37); // Remove UUID_ prefix
                    }
                }
                
                System.out.println("Sending filename: " + filename + " (from: " + fullFilename + ")");
                
                // Send filename length first, then filename, then file content
                dos.writeInt(filename.length());
                dos.writeUTF(filename);
                
                // Send the file content
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    oss.write(buffer, 0, bytesRead);
                }
                oss.flush();
                System.out.println("File '" + filename + "' sent to " + clientSocket.getInetAddress());
            } catch (IOException e) {
                System.err.println("Error sending file to client: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    System.err.println("Error closing client socket: " + e.getMessage());
                }
            }
        }
    }

}
