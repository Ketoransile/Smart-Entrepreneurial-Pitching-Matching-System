import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
	openapi: "3.0.3",
	info: {
		title: "SEPMS API",
		version: "1.0.0",
		description:
			"Smart Entrepreneurial Pitching & Matching System API documentation.",
	},
	servers: [
		{
			url: "http://localhost:5000",
			description: "Local development server",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
	},
};

const routesTs = path.resolve(process.cwd(), "src/routes/*.ts");
const routesJs = path.resolve(process.cwd(), "dist/routes/*.js");

export const openApiSpec = swaggerJsdoc({
	swaggerDefinition,
	apis: [routesTs, routesJs],
});
