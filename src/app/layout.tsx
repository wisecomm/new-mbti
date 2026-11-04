import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBTI 테스트",
  description: "질문에 답하고 나의 MBTI를 확인하세요",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col bg-surface">{children}</div>
      </body>
    </html>
  );
}
