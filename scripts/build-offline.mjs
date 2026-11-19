import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const root = process.cwd();
const outputPath = resolve(process.argv[2] || "index.html");
const bundle = await build({
  entryPoints: [resolve(root, "offline/entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "edge110"],
  jsx: "automatic",
  write: false,
  metafile: true,
  plugins: [{
    name: "portable-only-modules",
    setup(builder) {
      builder.onResolve({filter: /(?:^|\/)app-transport(?:\.ts)?$/}, args => {
        if(args.path === "@/lib/app-transport" || resolve(dirname(args.importer),args.path).replace(/\.ts$/, "") === resolve(root,"lib/app-transport")) return {path:resolve(root,"offline/app-transport.ts")};
      });
      builder.onResolve({filter: /(?:^|\/)point-sync-status(?:\.tsx)?$/}, args => {
        if(resolve(dirname(args.importer),args.path).replace(/\.tsx$/, "") === resolve(root,"features/market-pulse/point-sync-status")) return {path:resolve(root,"offline/point-sync-status.tsx")};
      });
    },
  }],
});
const forbiddenInputs = Object.keys(bundle.metafile.inputs).filter(path => /(?:^|\/)(?:db|worker)(?:\/|$)|app\/api\/|(?:hosted-point-drafts|session-drafts)\.ts$|(?:@cloudflare|drizzle-orm|vinext)(?:\/|$)/.test(path));
if(forbiddenInputs.length) throw new Error(`Le build local contient des modules serveur inutiles : ${forbiddenInputs.join(", ")}`);
const javascript = bundle.outputFiles.find((file) => file.path.endsWith(".js"))?.text ?? bundle.outputFiles[0]?.text;
if (!javascript) throw new Error("Le bundle JavaScript n'a pas été généré.");
const cssEntry = resolve(root, "offline/entry.css");
const styles = await postcss([tailwindcss({ base: root, optimize: { minify: true } })]).process(await readFile(cssEntry, "utf8"), { from: cssEntry });
const stylesheet = ":root{--font-geist-sans:system-ui,sans-serif;--font-geist-mono:ui-monospace,monospace}" + styles.css;
if (/@import\b/.test(stylesheet) || /url\(\s*["']?(?!data:)[^"')\s]+/i.test(stylesheet)) throw new Error("La feuille de style contient une dépendance externe.");
const favicon = (await readFile(resolve(root, "public/favicon.svg"))).toString("base64");
const appearanceBundle = await build({ entryPoints: [resolve(root, "lib/appearance.ts")], bundle: true, format: "esm", platform: "node", write: false });
const { appearanceBootstrapScript } = await import(`data:text/javascript;base64,${Buffer.from(appearanceBundle.outputFiles[0].text).toString("base64")}`);
const safeJavascript = javascript.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'self' blob: data:; worker-src blob:; base-uri 'none'; form-action 'none'; object-src 'none'">
<meta name="color-scheme" content="light dark"><title>Points de réunion</title><link rel="icon" href="data:image/svg+xml;base64,${favicon}">
<script>${appearanceBootstrapScript}</script><style>${stylesheet}</style></head><body><div id="root"></div><script>${safeJavascript}</script></body></html>`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, "utf8");
if (process.env.OFFLINE_BUILD_REPORT) await writeFile(resolve(process.env.OFFLINE_BUILD_REPORT), JSON.stringify({inputFiles:Object.keys(bundle.metafile.inputs),javascriptBytes:Buffer.byteLength(javascript),htmlBytes:Buffer.byteLength(html),serverModules:forbiddenInputs},null,2)+"\n");
console.log(outputPath);
