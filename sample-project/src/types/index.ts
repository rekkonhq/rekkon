export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  publishedAt?: Date;
  tags: string[];
  status: PostStatus;
}

export type PostStatus = 'draft' | 'published' | 'archived';

export interface ApiResponse<T> {
  data: T;
  error?: string;
  pagination?: {
    page: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreatePostInput {
  title: string;
  content: string;
  tags?: string[];
}

export type UpdatePostInput = Partial<CreatePostInput> & { id: string };
