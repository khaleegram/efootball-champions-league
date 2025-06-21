import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {currentYear} eArena. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary">Terms of Service</Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
