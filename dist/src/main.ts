import { ServerRequest, ServerResponse, Server } from "./server";
import axios from "axios";
const unfluff = require("../lib/node-unfluff/lib/unfluff");

let categories = [];

Server.init();

Server.route("GET /", async (req: ServerRequest, res: ServerResponse) => {
  const all = categories.reduce(
    (result, cat) => result.concat(cat.articles),
    []
  );
  res.render("home", { articles: all, category: "everything" });
});

Server.route("GET /view", async (req: ServerRequest, res: ServerResponse) => {
  const url = req.query.url;
  // for now, we don't support reader mode for reddit and tinhte
  if (url.match(/reddit.com|tinhte.vn/)) res.redirect(url);
  console.log("QUERY ", url);
  const r = await axios.get(url);
  const parsed = unfluff(r.data);
  res.render("view", { data: parsed });
});

Server.route(
  "GET /:category",
  async (req: ServerRequest, res: ServerResponse) => {
    const category = req.params.category;
    const found = categories.find(cat => cat.name === category);
    if (found) {
      res.render("home", { articles: found.articles, category: category });
    } else {
      res.redirect("/");
    }
  }
);

Server.start(() => {});

var path = require("path");
const { fork } = require("child_process");
let fetcher;
if (process.env.NODE_ENV !== "production") {
  fetcher = fork(path.join(__dirname, "fetcher.ts"), [
    "-r",
    "ts-node/register"
  ]);
} else {
  fetcher = fork("fetcher.ts");
}

fetcher.on("message", result => {
  console.log("UPDATED", result.length);
  categories = result;
});
