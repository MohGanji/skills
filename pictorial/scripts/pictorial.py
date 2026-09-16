#!/usr/bin/env python3
"""pictorial viewer -- a bare local page that plays a visual-only conversation.

  pictorial.py serve  [--port N] [--dir D] [--no-open]   start (idempotent) and open the viewer
  pictorial.py show   [--prompt TEXT] [FILE|-]           append one visual (file or stdin)
  pictorial.py reset  [--dir D]                          start a fresh conversation

Stdlib only, Python 3.8+. Binds 127.0.0.1 only. Visuals may be full documents
or bare fragments; fragments get wrapped in a themed shell that defines the
same CSS variables and c-{ramp} SVG classes as the inline widget, provides
sendPrompt()/openLink(), and renders <pre class="mermaid"> blocks.
"""
import argparse
import json
import os
import re
import shutil
import socket
import sys
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DEFAULT_DIR = Path(os.environ.get("PICTORIAL_DIR") or Path.home() / ".pictorial" / "session")
DEFAULT_PORT = int(os.environ.get("PICTORIAL_PORT") or 7428)  # P-I-C-T on a keypad

# name: light (fill, stroke, text) + dark (fill, stroke, text)
RAMPS = {
    "purple": ("#EEEDFE", "#534AB7", "#3C3489", "#3C3489", "#AFA9EC", "#CECBF6"),
    "teal":   ("#E1F5EE", "#0F6E56", "#085041", "#085041", "#5DCAA5", "#9FE1CB"),
    "coral":  ("#FAECE7", "#993C1D", "#712B13", "#712B13", "#F0997B", "#F5C4B3"),
    "pink":   ("#FBEAF0", "#993556", "#72243E", "#72243E", "#ED93B1", "#F4C0D1"),
    "gray":   ("#F1EFE8", "#5F5E5A", "#444441", "#444441", "#B4B2A9", "#D3D1C7"),
    "blue":   ("#E6F1FB", "#185FA5", "#0C447C", "#0C447C", "#85B7EB", "#B5D4F4"),
    "green":  ("#EAF3DE", "#3B6D11", "#27500A", "#27500A", "#97C459", "#C0DD97"),
    "amber":  ("#FAEEDA", "#854F0B", "#633806", "#633806", "#EF9F27", "#FAC775"),
    "red":    ("#FCEBEB", "#A32D2D", "#791F1F", "#791F1F", "#F09595", "#F7C1C1"),
}


def ramp_css():
    light, dark, rules = [], [], []
    for n, (lf, ls, lt, df, ds, dt) in RAMPS.items():
        light.append(".c-%s{--f:%s;--s:%s;--t:%s}" % (n, lf, ls, lt))
        dark.append(".c-%s{--f:%s;--s:%s;--t:%s}" % (n, df, ds, dt))
        rules.append(
            ".c-{n} rect,.c-{n} circle,.c-{n} ellipse,rect.c-{n},circle.c-{n},ellipse.c-{n}"
            "{{fill:var(--f);stroke:var(--s)}}.c-{n} text{{fill:var(--t)}}".format(n=n)
        )
    return "".join(light) + "@media(prefers-color-scheme:dark){" + "".join(dark) + "}" + "".join(rules)


SHELL = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3/dist/tabler-icons.min.css">
<style>
:root{color-scheme:light dark;--text-primary:#1f1f1d;--text-secondary:#5f5e5a;--text-muted:#888780;--surface-0:#f6f5f0;--surface-1:#fbfaf7;--surface-2:#fff;--border:#e3e1da;--border-strong:#c9c7bf;--border-stronger:#a9a79f;--bg-accent:#EEEDFE;--text-accent:#3C3489;--border-accent:#534AB7;--bg-danger:#FCEBEB;--text-danger:#791F1F;--border-danger:#A32D2D;--bg-success:#EAF3DE;--text-success:#27500A;--border-success:#3B6D11;--bg-warning:#FAEEDA;--text-warning:#633806;--border-warning:#854F0B;--radius:8px;--pad-sm:8px;--pad-md:12px;--pad-lg:16px;--pad-xl:24px;--gap-xs:4px;--gap-sm:8px;--gap-md:12px;--gap-lg:16px;--gap-xl:24px;--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--font-voice:Georgia,"Times New Roman",serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media(prefers-color-scheme:dark){:root{--text-primary:#e8e6df;--text-secondary:#b4b2a9;--text-muted:#888780;--surface-0:#161615;--surface-1:#1f1f1d;--surface-2:#262624;--border:#343431;--border-strong:#4a4a46;--border-stronger:#5f5e5a;--bg-accent:#26215C;--text-accent:#CECBF6;--border-accent:#AFA9EC;--bg-danger:#501313;--text-danger:#F7C1C1;--border-danger:#F09595;--bg-success:#173404;--text-success:#C0DD97;--border-success:#97C459;--bg-warning:#412402;--text-warning:#FAC775;--border-warning:#EF9F27}}
html,body{margin:0;background:transparent;color:var(--text-primary);font:15px/1.6 var(--font-sans)}
body{padding:4px 2px}
h1{font-size:22px;font-weight:500}h2{font-size:18px;font-weight:500}h3{font-size:16px;font-weight:500}
svg{max-width:100%;height:auto;display:block}
svg text{font-family:var(--font-sans)}
.t{font-size:14px;fill:var(--text-primary)}.ts{font-size:12px;fill:var(--text-secondary)}.th{font-size:14px;font-weight:500;fill:var(--text-primary)}
.node{cursor:pointer}.node:hover rect,.node:hover circle,.node:hover ellipse{stroke-width:2}
button,input,select,textarea{font:inherit;color:inherit}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
%%RAMPS%%
</style></head><body>
%%BODY%%
<script>
window.sendPrompt=function(t){try{navigator.clipboard.writeText(t)}catch(e){}parent.postMessage({type:"pictorial:prompt",text:t},"*")};
window.openLink=function(u){window.open(u,"_blank")};
if(document.querySelector(".mermaid")){import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs").then(function(m){var dark=matchMedia("(prefers-color-scheme: dark)").matches;m.default.initialize({startOnLoad:false,theme:dark?"dark":"neutral"});m.default.run()})}
</script></body></html>
"""

VIEWER = """<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pictorial</title>
<style>
:root{color-scheme:light dark;--bg:#f6f5f0;--card:#fff;--text:#1f1f1d;--muted:#888780;--border:#e3e1da;--you:#efede6}
@media(prefers-color-scheme:dark){:root{--bg:#161615;--card:#1f1f1d;--text:#e8e6df;--muted:#888780;--border:#343431;--you:#262624}}
html,body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--border);padding:10px 20px;display:flex;align-items:center;gap:10px;font-weight:500;z-index:1}
.dot{width:8px;height:8px;border-radius:50%;background:#1D9E75}
main{max-width:820px;margin:0 auto;padding:24px 16px 120px}
.turn{margin:0 0 28px}
.you{margin-left:auto;max-width:75%;width:fit-content;background:var(--you);border-radius:14px 14px 4px 14px;padding:8px 14px;color:var(--muted);font-size:14px;white-space:pre-wrap;margin-bottom:12px}
.visual{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;overflow:hidden}
iframe{display:block;width:100%;border:0;height:120px}
#empty{color:var(--muted);text-align:center;padding:80px 0}
#toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 16px;border-radius:10px;font-size:14px;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90vw}
#toast.on{opacity:1}
</style></head><body>
<header><span class="dot"></span>Pictorial</header>
<main><div id="empty">Waiting for the first visual&hellip;</div><div id="flow"></div></main>
<div id="toast"></div>
<script>
var seen=new Set(),session=null,flow=document.getElementById("flow"),empty=document.getElementById("empty"),toastEl=document.getElementById("toast"),toastT;
function toast(t){toastEl.textContent=t;toastEl.classList.add("on");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("on")},3500)}
function fit(f){var d=f.contentDocument;if(!d||!d.documentElement)return;var set=function(){f.style.height=Math.max(60,d.documentElement.scrollHeight)+"px"};set();try{new ResizeObserver(set).observe(d.documentElement)}catch(e){}setTimeout(set,500);setTimeout(set,2000)}
function add(e){empty.hidden=true;var t=document.createElement("section");t.className="turn";t.id="e"+e.id;if(e.prompt){var p=document.createElement("div");p.className="you";p.textContent=e.prompt;t.appendChild(p)}var c=document.createElement("div");c.className="visual";var f=document.createElement("iframe");f.title="visual "+e.id;f.onload=function(){fit(f)};f.src="/v/"+e.id+".html";c.appendChild(f);t.appendChild(c);flow.appendChild(t);t.scrollIntoView({behavior:"smooth",block:"start"})}
async function poll(){try{var r=await fetch("/feed",{cache:"no-store"});var j=await r.json();if(session!==null&&j.session!==session){flow.innerHTML="";seen.clear();empty.hidden=false}session=j.session;j.entries.forEach(function(e){if(!seen.has(e.id)){seen.add(e.id);add(e)}})}catch(err){}}
addEventListener("message",function(ev){if(ev.data&&ev.data.type==="pictorial:prompt"){toast("Copied — paste it in your terminal: "+ev.data.text)}});
poll();setInterval(poll,1000);
</script></body></html>
"""


def ensure_dir(d):
    d = Path(d)
    d.mkdir(parents=True, exist_ok=True)
    tok = d / ".session"
    if not tok.exists():
        tok.write_text(str(int(time.time() * 1000)))
    return d


def session_token(d):
    tok = Path(d) / ".session"
    return tok.read_text().strip() if tok.exists() else ""


def entries(d):
    out = []
    for f in sorted(Path(d).glob("[0-9][0-9][0-9][0-9].json")):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            pass
    return out


def next_index(d):
    nums = [int(f.stem) for f in Path(d).glob("[0-9][0-9][0-9][0-9].html")]
    return (max(nums) + 1) if nums else 1


def port_open(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.3):
            return True
    except OSError:
        return False


class Handler(BaseHTTPRequestHandler):
    directory = DEFAULT_DIR

    def log_message(self, *args):
        pass

    def _send(self, body, ctype="text/html; charset=utf-8", code=200):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/":
            return self._send(VIEWER)
        if path == "/feed":
            body = {"session": session_token(self.directory), "entries": entries(self.directory)}
            return self._send(json.dumps(body), "application/json")
        m = re.fullmatch(r"/v/(\d+)\.html", path)
        if m:
            f = Path(self.directory) / ("%04d.html" % int(m.group(1)))
            if f.exists():
                body = f.read_text(encoding="utf-8")
                if not re.search(r"<html|<!doctype", body[:400], re.I):
                    body = SHELL.replace("%%RAMPS%%", ramp_css()).replace("%%BODY%%", body)
                return self._send(body)
        self._send("not found", "text/plain; charset=utf-8", 404)


def cmd_serve(a):
    url = "http://127.0.0.1:%d/" % a.port
    if port_open(a.port):
        print("pictorial already running at " + url)
        return
    d = ensure_dir(a.dir)
    Handler.directory = d
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), Handler)
    print("pictorial viewer at %s  (dir %s)" % (url, d), flush=True)
    if not a.no_open:
        webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


def cmd_show(a):
    d = ensure_dir(a.dir)
    if a.file in (None, "-"):
        src = sys.stdin.read()
    else:
        src = Path(a.file).read_text(encoding="utf-8")
    if not src.strip():
        sys.exit("pictorial: empty visual")
    n = next_index(d)
    (d / ("%04d.html" % n)).write_text(src, encoding="utf-8")
    meta = {"id": n, "prompt": a.prompt or "", "ts": time.time()}
    (d / ("%04d.json" % n)).write_text(json.dumps(meta), encoding="utf-8")
    print("http://127.0.0.1:%d/#e%d" % (a.port, n))
    if not port_open(a.port):
        print("viewer not running -- start it with: pictorial.py serve", file=sys.stderr)


def cmd_reset(a):
    d = Path(a.dir)
    if d.exists():
        shutil.rmtree(d)
    ensure_dir(d)
    print("fresh conversation at " + str(d))


def main(argv=None):
    p = argparse.ArgumentParser(prog="pictorial.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("--dir", default=DEFAULT_DIR, help="conversation directory (default %s)" % DEFAULT_DIR)
        sp.add_argument("--port", type=int, default=DEFAULT_PORT, help="viewer port (default %d)" % DEFAULT_PORT)

    s = sub.add_parser("serve", help="start the viewer (no-op if already running) and open it")
    common(s)
    s.add_argument("--no-open", action="store_true", help="don't open the browser")
    s.set_defaults(fn=cmd_serve)

    s = sub.add_parser("show", help="append one visual; FILE or '-' for stdin")
    common(s)
    s.add_argument("--prompt", default="", help="the user's message this visual answers")
    s.add_argument("file", nargs="?", help="HTML file (fragment or full document); '-' or omitted reads stdin")
    s.set_defaults(fn=cmd_show)

    s = sub.add_parser("reset", help="start a fresh conversation")
    common(s)
    s.set_defaults(fn=cmd_reset)

    a = p.parse_args(argv)
    a.fn(a)


if __name__ == "__main__":
    main()
