import '../styles/globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'PMCS — Project Management & Coordination System',
  description: 'Enterprise multi-project coordination workspace for engineering and research teams.',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}