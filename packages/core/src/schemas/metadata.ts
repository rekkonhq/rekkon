import { z } from 'zod';

// Language-specific metadata (varies by language)
export const LanguageMetadataSchema = z.object({
  language: z.string().optional(),
  is_async: z.boolean().optional(),
  return_type: z.string().optional(),
  params: z
    .array(
      z.object({
        name: z.string(),
        type: z.string().optional(),
      })
    )
    .optional(),
  decorators: z.array(z.string()).optional(),
});

// Framework-specific metadata
export const FrameworkMetadataSchema = z.object({
  react_hooks: z.array(z.string()).optional(),
  route_path: z.string().optional(),
  route_method: z.string().optional(),
  component_type: z.enum(['client', 'server']).optional(),
});

// Git-specific metadata
export const GitMetadataSchema = z.object({
  last_modified: z.string().datetime().optional(),
  last_author: z.string().optional(),
  change_count: z.number().int().optional(),
  first_seen: z.string().datetime().optional(),
});

// Combined metadata schema (all optional)
export const NodeMetadataSchema = LanguageMetadataSchema.merge(FrameworkMetadataSchema).merge(
  GitMetadataSchema
).passthrough(); // Allow additional unknown fields

export type NodeMetadata = z.infer<typeof NodeMetadataSchema>;
