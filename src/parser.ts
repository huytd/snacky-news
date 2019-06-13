import * as RssParser from "rss-parser";
import * as moment from "moment";

export interface RawArticle {
  title: string;
  url: string;
  domain: string;
  pubDate: string;
  isoDate: string;
  image: string;
  text: string;
}

const dateDiff = (a: any, b: any) => Math.floor((a - b) / 1000 / 86400);

const rss = new RssParser();

const dateWithinRange = (date: string, range: number): boolean => {
  const parsedDate = new Date(date);
  return dateDiff(new Date(), parsedDate) <= range;
};

export const sourcesToRawArticles = async (
  sources: string[]
): Promise<RawArticle[]> => {
  const promises = sources.map(async (src: string) => {
    try {
      const feed = await rss.parseURL(src);
      return feed.items.map((item: RssParser.Item) => {
        return <RawArticle>{
          title: item.title,
          url: item.link,
          pubDate: moment(item.pubDate)
            .startOf("hour")
            .fromNow(),
          isoDate: item.isoDate,
          domain: item.link ? item.link.split("/")[2] : "",
          image: "",
          text: ""
        };
      });
    } catch (e) {
      console.log("ERR at ", src, e);
    }
  });
  try {
    const results: RawArticle[][] = await Promise.all(promises);
    return <RawArticle[]>[].concat(...results);
  } catch (e) {
    console.log("ERR", e);
  }
};

export const articlesWithinRange = (
  articles: RawArticle[],
  dateRange: number
): RawArticle[] => {
  return articles.filter((article: RawArticle) =>
    dateWithinRange(article.isoDate, dateRange)
  );
};

export const sortArticlesByDate = (articles: RawArticle[]): RawArticle[] => {
  articles.sort((a, b) => {
    const da: number = new Date(a.isoDate).getTime();
    const db: number = new Date(b.isoDate).getTime();
    return db - da;
  });
  return articles;
};
