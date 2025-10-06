import express, { Application } from 'express';
import http, { Server } from 'http';
import { Server as IOServer } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SocketServer {
    private app: Application;
    private httpServer: Server;
    private io: IOServer;
    private readonly port: number = 3000;

    constructor(port?: number) {
        this.port = port || Number(process.env.PORT);
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.io = new IOServer(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            }
        });
        this.app.use(cors());
        this.configureRoutes();
        this.configureSocketEvents();
    }

    private configureRoutes() {
        this.app.get('/', (req, res) => res.send("Hello"));
    }

    private configureSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log('connected: ', socket.id);

            socket.on("login", async (userId: string) => {
                let user = await prisma.user.findUnique({ where: { id: userId } });

                if (!user) {
                    user = await prisma.user.create({
                        data: { id: userId, online: true }
                    });
                } else {
                    user = await prisma.user.update({
                        where: { id: userId },
                        data: { online: true }
                    });
                }

                console.log(`User ${userId} logged in`);
                this.io.emit("user_update", user); 
            });

            socket.on("logout", async (userId: string) => {
                const user = await prisma.user.update({
                    where: { id: userId },
                    data: { online: false }
                });
                console.log(`User ${userId} logged out`);
                this.io.emit("user_update", user); 
            });

            socket.on('disconnect', () => {
                console.log('disconnected: ', socket.id);
            });
        });
    }

    public start() {
        this.httpServer.listen(
            this.port,
            () => console.log(`Listening at :${this.port}`)
        );
    }
}

new SocketServer(3000).start();
