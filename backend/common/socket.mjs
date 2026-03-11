import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, options = {}) => {
    io = new Server(server, {
        cors: options.cors || {
            origin: ['http://localhost:8081', 'https://dmedina9.github.io', 'https://secretario-api.onrender.com'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);
        socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
    });

    return io;
};

export const getIo = () => io;

export const broadcast = (event, data) => {
    if (!io) return;
    io.emit(event, data);
};

export default { initSocket, getIo, broadcast };
