import '../styles/globals.css';
export const metadata = {
  title: 'Project Manager Portal',
  description: 'MVP for the Project Manager web portal',
};
export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}