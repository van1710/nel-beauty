import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./Providers"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nel Beauty | Coiffure & Tresses à Ottawa",
  description: "Réservez votre séance de coiffure chez Nel Beauty. Spécialiste en tresses et soins capillaires à Ottawa.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <div className="flex-grow">
            {children}
          </div>
          {/* 💡 CORRECTION : On a enlevé le <Footer /> fixe d'ici pour le rendre dynamique */}
        </AuthProvider>
      </body>
    </html>
  );
}