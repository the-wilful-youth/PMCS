import '../styles/globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'Project Manager Portal',
  description: 'MVP for the Project Manager web portal',
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