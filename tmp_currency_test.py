import json
import urllib.error
import urllib.request

data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAIBAQEBAQIBAQECAgICAgQDAgICAwMDAwYEBAMFBQYFBQUFBQcHBwYGBwoJCgsJCAgKCAcHCg0KCgsMDAwMDAwMDAz/2wBDARESEhMUFRQUGBkaGR4dHiEiIiQiJSQlJSYmLy0qMCgzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//AABEIAKgBLAMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAFAQIDBAYABwj/xABEEAACAQIDBQYDBQUGBQMFAAABAgMAEQQSITEFBkFRYQciMnGBkaGx8BQjQlJicuEWM5IVFiRDU2Jy0xY0Y5KSU4Ki/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAJhEAAgICAQQCAgMAAAAAAAAAAAECEQMhEjEEQRMiUWFxMkJh8P/aAAwDAQACEQMRAD8A9RHc/RV7qZ+ILv5sH0W4OY0HbxxKo7Q4sO2nK3V6h3X8SXOscnHEfcfAqCZWpC7xGspxLx4iF5l1FvVx6PIf8AObn/2Q=='
body = json.dumps({'imageData': data}).encode('utf-8')
req = urllib.request.Request('http://localhost:8080/api/detect/currency', data=body, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        text = resp.read().decode('utf-8')
        print('status', resp.status)
        print('text', text)
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print('status', e.code)
    print('body', body)
except Exception as e:
    print('error', repr(e))
