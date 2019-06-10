import * as express from "express";

type ServerPort = string | number;
export type ServerRequest = express.Request;
export type ServerResponse = express.Response;

interface ServerFn {
  (req: ServerRequest, res: ServerResponse): Promise<void>;
}

export class Server {
  private static app: express.App;
  private static port: ServerPort = process.env.PORT || 3366;

  public static init(): void {
    Server.app = express();
    Server.app.set("view engine", "pug");
    Server.app.set("views", "views");
  }

  public static route(input: string, handler: ServerFn): void {
    const parts: string[] = input.split(" ");
    if (parts.length < 2)
      throw new Error(
        `Invalid syntax: Route definition should be '<METHOD> <path>'`
      );
    const method = parts[0].trim();
    const path = parts[1].trim();
    if (!Server.app[method.toLowerCase()])
      throw new Error(`Unsupported method: ${method} is not supported!`);
    Server.app[method.toLowerCase()](path, handler);
  }

  public static start(fn: Function | undefined): void {
    Server.app.listen(Server.port, () => {
      console.log(`SERVER IS RUNNING ON ${Server.port}...`);
      if (fn) fn();
    });
  }
}

export default Server;
