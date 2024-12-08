import http.server
import socketserver
import sys

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_error(self, format, *args):
        # Suppress BrokenPipeError
        if "Broken pipe" in format % args:
            return
        super().log_error(format, *args)

if __name__ == "__main__":
    PORT = 8000
    Handler = CustomHTTPRequestHandler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (http://0.0.0.0:{PORT}/) ...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
