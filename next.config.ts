import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  turbopack: {},
  outputFileTracingIncludes: {
    '/api/**/*': ['./dev.db'],
    '/admin/**/*': ['./dev.db'],
    '/checkout/**/*': ['./dev.db'],
    '/checkout': ['./dev.db'],
    '/visitors': ['./dev.db'],
    '/rota': ['./dev.db'],
    '/perfil': ['./dev.db'],
    '/analytics': ['./dev.db'],
    '/': ['./dev.db'],
  },
};

// @ts-ignore
export default withPWA({
  dest: "public",
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
