# PowerShell script to start both the server and client
# Start the Express server
Start-Process powershell -ArgumentList "-Command npm run server"

# Start the Angular application
Start-Process powershell -ArgumentList "-Command cd frontend/workwave-client; ng serve --port 4202"

Write-Host "Application started!"
Write-Host "Express server running on http://localhost:5002"
Write-Host "Angular application running on http://localhost:4202"
Write-Host "Press Ctrl+C to stop this message. Close the PowerShell windows to stop the servers." 