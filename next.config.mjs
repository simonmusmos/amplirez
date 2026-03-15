/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
      "puppeteer-extra-plugin",
      "@sparticuz/chromium",
      "@react-pdf/renderer",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };

      // Force all puppeteer packages and their transitive deps to use
      // Node's native require instead of being bundled by webpack.
      const puppeteerPackages = [
        "puppeteer-core",
        "puppeteer-extra",
        "puppeteer-extra-plugin-stealth",
        "puppeteer-extra-plugin",
        "@sparticuz/chromium",
        "devtools-protocol",
        "clone-deep",
        "merge-deep",
      ];

      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }, callback) => {
          if (puppeteerPackages.some((pkg) => request === pkg || request.startsWith(pkg + "/"))) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
