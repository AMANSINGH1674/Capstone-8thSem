import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { ModeToggle } from '@/components/mode-toggle';
import { toast } from 'sonner';
import { Loader2, Camera, Share2, Copy, ExternalLink } from 'lucide-react';

// ── Schema ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name must be under 100 characters'),
  department: z
    .string()
    .max(100, 'Department must be under 100 characters')
    .optional()
    .or(z.literal('')),
  year_of_study: z
    .number()
    .int()
    .min(1)
    .max(6)
    .nullable()
    .optional(),
  roll_number: z
    .string()
    .max(30, 'Roll number must be under 30 characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(300, 'Bio must be under 300 characters')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Must be a valid URL (include https://)')
    .optional()
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileRow {
  id: string;
  full_name: string | null;
  department: string | null;
  year_of_study: number | null;
  roll_number: string | null;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
  is_portfolio_public: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Query ─────────────────────────────────────────────────────────────────

  const [portfolioPublic, setPortfolioPublic] = useState(false);

  const { data: profile, isLoading } = useQuery<ProfileRow | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department, year_of_study, roll_number, bio, website, avatar_url, is_portfolio_public')
        .eq('id', user!.id)
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data ?? null;
    },
    enabled: !!user,
  });

  // ── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '', department: '', year_of_study: null,
      roll_number: '', bio: '', website: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name:    profile.full_name    ?? '',
        department:   profile.department   ?? '',
        year_of_study: profile.year_of_study ?? null,
        roll_number:  profile.roll_number  ?? '',
        bio:          profile.bio          ?? '',
        website:      profile.website      ?? '',
      });
      setPortfolioPublic(profile.is_portfolio_public ?? false);
    }
  }, [profile, form]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      const { error } = await supabase.from('profiles').upsert({
        id:                  user!.id,
        full_name:           values.full_name,
        department:          values.department || null,
        year_of_study:       values.year_of_study ?? null,
        roll_number:         values.roll_number || null,
        bio:                 values.bio || null,
        website:             values.website || null,
        is_portfolio_public: portfolioPublic,
        updated_at:          new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const portfolioUrl = `${window.location.origin}/portfolio/${user?.id}`;
  const handleCopyPortfolioLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    toast.success('Portfolio link copied!');
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('student_uploads')
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('student_uploads').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: data.publicUrl });
      if (updateError) throw new Error(updateError.message);

      toast.success('Avatar updated!');
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avatarUrl = avatarPreview ?? profile?.avatar_url ?? undefined;
  const initials = (profile?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a photo to personalise your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt="Avatar" />
                <AvatarFallback className="text-xl font-bold bg-accent/20 text-accent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow hover:bg-accent/90 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="sr-only">Change avatar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{profile?.full_name ?? 'Your Name'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              {avatarFile && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={uploadAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar && (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  )}
                  Save photo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile details card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Manage your public profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}
              className="space-y-5"
            >
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input value={user?.email ?? ''} disabled className="bg-muted/50" />
              </div>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Computer Science" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year_of_study"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study</FormLabel>
                      <Select
                        value={field.value?.toString() ?? ''}
                        onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((y) => (
                            <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="roll_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number / Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CS2021001" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Portfolio sharing card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Public Portfolio
          </CardTitle>
          <CardDescription>
            Share a public link to your verified achievements — for job applications, scholarships, or admissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Make portfolio public</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only verified records are shown on your public page.
              </p>
            </div>
            <Switch
              checked={portfolioPublic}
              onCheckedChange={(checked) => {
                setPortfolioPublic(checked);
                // Save immediately
                supabase.from('profiles')
                  .update({ is_portfolio_public: checked })
                  .eq('id', user!.id)
                  .then(() => {
                    toast.success(checked ? 'Portfolio is now public!' : 'Portfolio set to private');
                    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
                  });
              }}
            />
          </div>
          {portfolioPublic && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 border px-3 py-2">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground flex-1 truncate">{portfolioUrl}</span>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs shrink-0" onClick={handleCopyPortfolioLink}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                  View
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme card */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred colour theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <span className="text-sm text-muted-foreground">
              Toggle between light, dark, and system theme
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
