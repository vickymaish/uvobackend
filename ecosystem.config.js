module.exports = {
    apps: [
        {
            name: "server",
            script: "/usr/src/app/server.cjs",  // Absolute path
            watch: false,
        },
        {
            name: "scraper",
            script: "/usr/src/app/scraper.cjs", // Absolute path
            watch: false,
        }
    ],
};
