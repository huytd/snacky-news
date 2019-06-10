import { ServerRequest, ServerResponse, Server } from "./server";
import {
  RawArticle,
  sourcesToRawArticles,
  articlesWithinRange
} from "./parser";
import axios from "axios";
const unfluff = require("../lib/node-unfluff/lib/unfluff");

const CACHE_TIME = 60000;
let last_cached: number = 0;

const feed_vietnamese = [
  // Vietnamese
  "https://tuoitre.vn/rss/tin-moi-nhat.rss",
  "https://vnexpress.net/rss/tin-moi-nhat.rss",
  "https://tinhte.vn/rss"
  /*
  "https://www.rfa.org/vietnamese/in_depth/rss2.xml",
  "https://www.voatiengviet.com/api/zkvypemovm",
  "https://www.voatiengviet.com/api/z$uyietpv_",
  "https://www.voatiengviet.com/api/zruyyeuivt",
  "https://www.voatiengviet.com/api/z_ty_erivy"
  */
];

const feed_economy = [
  // Investing, Economics and Financial
  "http://feeds.marketwatch.com/marketwatch/topstories/",
  "https://www.investing.com/rss/news.rss",
  "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  "https://www.cnbc.com/id/10000664/device/rss/rss.html",
  "https://www.cnbc.com/id/10000115/device/rss/rss.html",
  "https://www.cnbc.com/id/15839069/device/rss/rss.html",
  "http://feeds.reuters.com/reuters/businessNews"
];

const feed_tech = [
  // Technology
  "https://www.reddit.com/r/Technologies+elm+haskell+emacs+javascript+programming+rust.rss",
  "http://feeds.feedburner.com/TechCrunch/",
  "https://news.ycombinator.com/rss",
  "http://feeds.arstechnica.com/arstechnica/index",
  "https://www.theverge.com/rss/index.xml",
  "https://live.engadget.com/rss.xml",
  "https://www.wired.com/feed/rss",
  "https://thenextweb.com/feed/"
];

const feed_other = [
  // Other News
  "https://www.theonion.com/rss",
  "https://www.reddit.com/r/UpliftingNews+worldnews.rss",
  "http://feeds.reuters.com/reuters/topNews",
  "http://feeds.reuters.com/Reuters/domesticNews",
  "http://feeds.reuters.com/Reuters/worldNews"
];

const categories = [
  {
    name: "vietnamese",
    sources: feed_vietnamese,
    articles: []
  },
  {
    name: "financial",
    sources: feed_economy,
    articles: []
  },
  {
    name: "technology",
    sources: feed_tech,
    articles: []
  },
  {
    name: "other",
    sources: feed_other,
    articles: []
  }
];

async function fetchData(): Promise<void> {
  const current_time = Date.now();
  if (current_time - last_cached > CACHE_TIME) {
    const promises = categories.map(async (cat, i) => {
      try {
        const articles = await sourcesToRawArticles(cat.sources);
        categories[i].articles = articlesWithinRange(articles, 2);
        return 1;
      } catch {
        return 0;
      }
    });
    const results = await Promise.all(promises);
    console.log("CACHED", results);
    if (results.reduce((acc, n) => acc + n, 0) == categories.length) {
      last_cached = Date.now();
    }
  }
}

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

Server.start(() => {
  fetchData();
  setInterval(fetchData, CACHE_TIME);
});
