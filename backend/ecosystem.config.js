module.exports = {
  apps: [
    {
      name: "codescope-api",
      script: "/var/www/codescope/venv/bin/uvicorn",
      args: "app.main:app --host 0.0.0.0 --port 8000",
      cwd: "/var/www/codescope/backend",
      interpreter: "none",
      env: {
        PYTHONUNBUFFERED: "1",
      }
    }
  ]
}

