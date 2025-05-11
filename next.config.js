/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
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
    }
}

module.exports = nextConfig 