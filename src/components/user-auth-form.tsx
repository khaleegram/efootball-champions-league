
// components/user-auth-form.tsx
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { handleSignIn, handleSignUp, handleGoogleSignIn } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode: 'login' | 'signup';
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type UserFormValue = z.infer<typeof formSchema>;

export function UserAuthForm({ className, mode, ...props }: UserAuthFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: UserFormValue) => {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await handleSignIn(data.email, data.password);
      } else {
        await handleSignUp(data.email, data.password);
      }
      // The layout will handle the redirect.
      toast({ title: mode === 'login' ? 'Login successful!' : 'Account created!', description: "Redirecting..." });
    } catch (error: any) {
      let message = 'An unknown error occurred.';
      const code = error.code;
    
      if (code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please log in instead.';
      } else if (code === 'auth/invalid-credential') {
        message = 'No account found with this email or password is incorrect.';
      } else if (code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (code === 'auth/invalid-email') {
        message = 'The email address is badly formatted.';
      } else if (code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }
    
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await handleGoogleSignIn();
       // The layout will handle the redirect.
      toast({ title: 'Login successful!', description: "Redirecting..." });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Google Sign-In Error',
        description: error.message || 'Could not sign in with Google. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }


  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register('email')}
            />
            {errors?.email && <p className="px-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete={mode === 'login' ? "current-password" : "new-password"}
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...register('password')}
            />
            {errors?.password && <p className="px-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Sign Up'} with Email
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading || isGoogleLoading} onClick={onGoogleSignIn}>
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.75 8.36,4.73 12.19,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.19,2C6.42,2 2.03,6.8 2.03,12C2.03,17.2 6.42,22 12.19,22C17.6,22 21.54,18.33 21.54,12.81C21.54,11.76 21.45,11.43 21.35,11.1Z"></path></svg>
        )}{' '}
        Google
      </Button>
    </div>
  );
}
