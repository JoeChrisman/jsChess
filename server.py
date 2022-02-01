import http.server
import socketserver

hostname = "localhost"
port = 7000

class WebServer(http.server.SimpleHTTPRequestHandler):
	def do_GET(self):
		if (self.path == "/"):
			self.path = "html/index.html"
        
		return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
if __name__ == "__main__":
	handler = WebServer
	webServer = socketserver.TCPServer((hostname, port), handler);
	print("[WEBSERVER] started on http://%s:%s." % (hostname, port))
	
	try:
		webServer.serve_forever()
	except KeyboardInterrupt:
		pass
	webServer.server_close();
	print("[WEBSERVER] closed.")
