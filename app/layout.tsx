import "./globals.css";
export const metadata = { title: "Lead Catcher PH - Walang Lead na Mawawala" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{ margin: 0, background: "#F8FAFC", fontFamily: "system-ui, sans-serif" }}>{children}</body></html>);
}
