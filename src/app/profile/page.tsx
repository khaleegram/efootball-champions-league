"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(20),
  psnId: z.string().optional(),
  xboxGamertag: z.string().optional(),
  konamiId: z.string().optional(),
  pcId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      psnId: '',
      xboxGamertag: '',
      konamiId: '',
      pcId: '',
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username || '',
        psnId: userProfile.psnId || '',
        xboxGamertag: userProfile.xboxGamertag || '',
        konamiId: userProfile.konamiId || '',
        pcId: userProfile.pcId || '',
      });
    }
  }, [userProfile, form]);

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsLoading(true);
    try {
      await updateUserProfile(user.uid, values);
      toast({ title: "Success!", description: "Your profile has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="container py-10">
        <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle className="font-headline text-3xl">Profile Settings</CardTitle>
            <CardDescription>Manage your public profile and game IDs.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                        <Input placeholder="Your public display name" {...field} />
                    </FormControl>
                    <FormDescription>This will be displayed on tournament pages.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold">Game IDs</h3>
                    <p className="text-sm text-destructive font-medium">Important: These IDs are self-reported and NOT verified by eArena. Ensure they are correct for others to find you.</p>
                     <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="psnId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>PSN ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your PlayStation ID" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="xboxGamertag"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Xbox Gamertag</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Xbox Gamertag" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="konamiId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Konami ID (Mobile)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Konami ID" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="pcId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>PC ID (e.g., Steam)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your PC gaming ID" {...field} />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
