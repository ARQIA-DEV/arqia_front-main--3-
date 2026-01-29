/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      // future use: se usar imagens externas
      domains: ['arqia.onrender.com'],
    },
    env: {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    },
  }
  
  module.exports = nextConfig
  