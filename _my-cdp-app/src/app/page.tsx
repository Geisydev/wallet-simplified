"use client";
import ClientApp from "@/components/ClientApp";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

/**
 * Home page for the Next.js app
 *
 * @returns The home page
 */
export default function Home() {
  return (
    <Providers>
      <Header />
      <ClientApp />
    </Providers>
  );
}
