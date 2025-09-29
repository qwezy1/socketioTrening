import express, { Application } from "express";
import http, { Server } from "http";
import { Server as IOServer, Socket } from "socket.io";
import cors from "cors";


class SocketServer {
  private app: Application;
  private httpServer: Server;
  private io: IOServer;
  private readonly port: number = 3000;

  constructor(port?: number) {
    this.port = port || Number(process.env.PORT) || 3000;
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = new IOServer(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.app.use(cors());

    this.configureRouters();
    this.configureSocketEvents();
  }

  private configureRouters() {
    this.app.get("/", (req, res) => res.send("Server is running"));
  }

  public start() {
    this.httpServer.listen(this.port, () =>
      console.log(`Server listening on port ${this.port}`)
    );
  }

  private configureSocketEvents() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[connect] socket.id=${socket.id}`);

      socket.emit("server-message", "welcome");

      socket.broadcast.emit("server-message", "пользователь подключился");

      socket.on("client-message", (message: string) => {
        console.log(`[message] from=${socket.id}, data=${message}`);

        socket.emit("server-message", `вы отправили: ${message}`);

        
        socket.broadcast.emit("server-message", message);
      });

      
      socket.on("disconnect", () => {
        console.log(`[disconnect] socket.id=${socket.id}`);
        socket.broadcast.emit("server-message", "пользователь отключился");
      });
    });
  }
}

new SocketServer().start();
