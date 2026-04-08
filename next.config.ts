// next.config.ts (전체 교체)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // -----------------------------------------------------------------
  // 이미지 설정 – 로컬 파일 최적화 비활성화 (핵심)
  // -----------------------------------------------------------------
  images: {
    // 로컬 파일에 대해 이미지 최적화 서버를 사용하지 않음
    unoptimized: true,

    // 외부 이미지(Unsplash 등) 사용 시 그대로 유지
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },

  // (선택) 혹시 `basePath` 나 `assetPrefix` 가 설정돼 있으면 주석 처리
  // basePath: "/my-app",
  // assetPrefix: "https://cdn.example.com",
};

export default nextConfig;
