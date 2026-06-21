import { Cinzel, Crimson_Text } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-display"
});

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-body"
});

export const metadata = {
  title: "Block League — Tournament Bracket",
  description: "Arena turnamen epik Block League — pertarungan para ksatria"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${cinzel.variable} ${crimsonText.variable}`}>{children}</body>
    </html>
  );
}
