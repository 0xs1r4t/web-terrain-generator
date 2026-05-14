import type { Metadata } from "next";
export const metadata: Metadata = { title: "Fairy Forest Glade" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, background: "#050d15" }}>
        {children}
      </body>
    </html>
  );
}
