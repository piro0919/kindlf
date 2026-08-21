"""確認用の静的サーバー。

`python3 -m http.server` はキャッシュ制御のヘッダを送らないので、ブラウザが
Last-Modified から勝手に鮮度を判断し、書き換えたファイルが画面に出てこない。
毎回取りに来させる。
"""
import functools, http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8787


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'http://127.0.0.1:{PORT}/  (Ctrl-C で停止)')
    httpd.serve_forever()
