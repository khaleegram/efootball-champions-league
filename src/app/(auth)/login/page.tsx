import { UserAuthForm } from '@/components/user-auth-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight font-headline">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in to your account
        </p>
      </div>
      <UserAuthForm mode="login" />
      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
          Don&apos;t have an account? Sign Up
        </Link>
      </p>
    </>
  )
}
