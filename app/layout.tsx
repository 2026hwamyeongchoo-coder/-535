import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STOWMASTER 3D | 선박 컨테이너 적재",
  description: "3차원 선박 컨테이너 적재와 무게중심 관리를 체험하는 게임입니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
