// This component is now a simple, pass-through server component.
// The middleware handles redirecting authenticated users away from this layout.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container relative flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
            <div className="absolute inset-0 bg-primary" />
            <div className="relative z-20 flex items-center text-lg font-medium font-headline">
                eArena
            </div>
            <div className="relative z-20 mt-auto">
                <blockquote className="space-y-2">
                <p className="text-lg">
                    &ldquo;This platform has revolutionized how we run our local eFootball leagues. A game-changer!&rdquo;
                </p>
                <footer className="text-sm">Community Organizer</footer>
                </blockquote>
            </div>
        </div>
        <div className="lg:p-8">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                {children}
            </div>
        </div>
    </div>
  )
}
