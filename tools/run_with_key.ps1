# Prompt for OpenAI key securely and start the FastAPI server for local development.
# Usage: in PowerShell (from project root) run: .\tools\run_with_key.ps1

$openaiKey = Read-Host "Enter your OpenAI API key" -AsSecureString
if(-not $openaiKey){ Write-Host "No key provided. Exiting."; exit 1 }

# convert secure string to plain text for the child process environment only
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($openaiKey)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

$sessionSecret = Read-Host "Enter SESSION_SECRET (press Enter to auto-generate)"
if(-not $sessionSecret){ $sessionSecret = [guid]::NewGuid().ToString() }

# Set environment variables for this process
$env:OPENAI_API_KEY = $plain
$env:SESSION_SECRET = $sessionSecret

Write-Host "Starting uvicorn main:app --reload"
# Start the server (this runs in the current shell; stop with Ctrl+C)
uvicorn main:app --reload
