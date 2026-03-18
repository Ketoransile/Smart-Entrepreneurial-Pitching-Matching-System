import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

let io: Server | null = null;

export const initializeSocket = (server: HttpServer): Server => {
	io = new Server(server, {
		cors: {
			origin: process.env.CLIENT_URL || "http://localhost:3000",
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		socket.on("join:user", (userId: string) => {
			if (userId) {
				socket.join(`user:${userId}`);
			}
		});

		socket.on("join:conversation", (conversationId: string) => {
			if (conversationId) {
				socket.join(`conversation:${conversationId}`);
			}
		});
	});

	return io;
};

export const getSocket = (): Server | null => io;

export const emitToUser = (
	userId: string,
	event: string,
	payload: Record<string, unknown>,
): void => {
	if (!io) {
		return;
	}

	io.to(`user:${userId}`).emit(event, payload);
};

export const emitToConversation = (
	conversationId: string,
	event: string,
	payload: Record<string, unknown>,
): void => {
	if (!io) {
		return;
	}

	io.to(`conversation:${conversationId}`).emit(event, payload);
};
