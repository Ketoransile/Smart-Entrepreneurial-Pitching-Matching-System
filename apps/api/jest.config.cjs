module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests", "<rootDir>/src/tests"],
	moduleFileExtensions: ["ts", "js", "json"],
	testMatch: ["**/*.test.ts"],
	clearMocks: true,
	modulePathIgnorePatterns: ["<rootDir>/dist"],
};
