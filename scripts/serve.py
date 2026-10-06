"""
Serve the built site for testing on a phone.

    python scripts/serve.py            # http://<your LAN address>:4173
    python scripts/serve.py 8080 out

Why this exists rather than `python -m http.server`: that one does not
implement HTTP range requests. It answers `Range:` with a plain 200 and the
whole file, and never sends `Accept-Ranges`.

**iOS Safari will not play a video from a server that cannot serve ranges.**
It shows the poster and nothing else, for ever. A desktop browser downloads
the file whole and plays it, so the same page looks fine on a laptop and
broken on the phone — which is exactly how this was found, and it is worth
knowing before blaming the encode, the codec or the markup.

Three more things this server does that `python -m http.server` does not, all
for the same reason: Safari is strict about media where a desktop browser
guesses.

  * **HTTP/1.1**, so the connection stays open. A media element makes a string
    of ranged requests and over HTTP/1.0 every one of them is a new connection.
  * **`.webp` and `.woff2` get their real media types.** Python's mimetypes
    reads the Windows registry, which knows neither, so they would go out as
    `application/octet-stream`.
  * **Media is cacheable.** `no-store` on a video is worth avoiding: the
    element re-reads ranges it has already fetched, and a response it is not
    allowed to keep has to be fetched again every time. Markup and scripts
    stay uncacheable, so a rebuild still shows up on the next refresh.

Real hosting (Netlify, Vercel, S3, nginx) does all of this, so none of it ever
bites anywhere but here.
"""

import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RANGE = re.compile(r"bytes=(\d*)-(\d*)")

TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".webmanifest": "application/manifest+json",
}
KEEP = (".mp4", ".webm", ".webp", ".avif", ".jpg", ".jpeg", ".png", ".svg", ".woff2", ".woff")


class Handler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler, plus the things it is missing."""

    protocol_version = "HTTP/1.1"

    def guess_type(self, path):
        return TYPES.get(os.path.splitext(str(path))[1].lower()) or super().guess_type(path)

    def send_head(self):
        header = self.headers.get("Range")
        if not header:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()

        match = RANGE.match(header.strip())
        if not match:
            return super().send_head()

        size = os.path.getsize(path)
        first, last = match.group(1), match.group(2)
        if first == "":                       # bytes=-500 — the tail
            start, end = max(0, size - int(last or 0)), size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1
        end = min(end, size - 1)

        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        self.length = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        """Only as far as the range asked for."""
        left = getattr(self, "length", None)
        self.length = None
        if left is None:
            return super().copyfile(source, outputfile)
        while left > 0:
            chunk = source.read(min(64 * 1024, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)

    def end_headers(self):
        """Markup fresh every time; media kept, because a video re-reads it."""
        ext = os.path.splitext(self.path.split("?")[0])[1].lower()
        self.send_header("Cache-Control", "public, max-age=300" if ext in KEEP else "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def log_request(self, code="-", size="-"):
        """One line per request, with the two fields that matter for media.

        iOS fetches video from a separate process (`mediaserverd`, which calls
        itself AppleCoreMedia) over its own connections, so its requests are
        the only way to see what the phone's media stack actually asked for
        and what it got back. A silent server hides exactly the thing worth
        looking at."""
        rng = self.headers.get("Range") or "-"
        ua = (self.headers.get("User-Agent") or "-").split(" ")[0][:28]
        line = f"{code} {self.command} {self.path}  range={rng}  {ua}"
        print(line, file=sys.stderr, flush=True)
        sys.stderr.flush()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    root = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "out"
    )
    if not os.path.isdir(root):
        sys.exit(f"{root} does not exist — run `npm run build` first")
    ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=root)).serve_forever()


if __name__ == "__main__":
    main()
