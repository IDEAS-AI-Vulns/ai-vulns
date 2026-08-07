FROM python:3.11-slim

WORKDIR /app

# Install Flask
RUN pip install --no-cache-dir flask

# Copy the application
COPY app.py .

# Default port (can be overridden with environment variable)
ENV PORT=5000

# Expose the port
EXPOSE ${PORT}

# Run the application
CMD ["python", "app.py"]
