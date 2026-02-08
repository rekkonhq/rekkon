import { z } from 'zod';

export const PrivacyTier = z.enum(['local', 'structure', 'enhanced']);
export type PrivacyTier = z.infer<typeof PrivacyTier>;

export const AnalysisStatus = z.enum(['pending', 'analyzing', 'ready', 'error']);
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),

  // Repo connection
  repo_url: z.string().nullable().optional(),
  repo_provider: z.enum(['github', 'gitlab', 'bitbucket', 'local']).nullable().optional(),
  default_branch: z.string().default('main'),
  repo_private: z.boolean().default(true),

  // Privacy
  privacy_tier: PrivacyTier.default('local'),

  // Detected info
  detected_framework: z.string().nullable().optional(),
  detected_languages: z.array(z.string()).nullable().optional(),
  primary_language: z.string().nullable().optional(),

  // Status
  analysis_status: AnalysisStatus.default('pending'),

  // Settings
  settings: z.record(z.unknown()).default({}),
});

export type Project = z.infer<typeof ProjectSchema>;
