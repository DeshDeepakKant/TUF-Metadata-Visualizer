/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // Match all API routes
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
                ]
            }
        ]
    },
    reactStrictMode: true,
    output: 'export',
    compiler: {
        styledComponents: true,
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            net: false,
            tls: false,
            fs: false,
            http: false,
            https: false
        };
        return config;
    },
    // External packages that should be treated as server-only
    experimental: {
        serverComponentsExternalPackages: ['tuf-js']
    },
    // Allow fetching from external domains for remote TUF repositories
    async rewrites() {
        return {
            beforeFiles: [
                // Proxy requests to external TUF repositories to avoid CORS issues
                {
                    source: '/proxy/:url*',
                    destination: 'https://:url*',
                },
            ],
        }
    }
}

module.exports = nextConfig 