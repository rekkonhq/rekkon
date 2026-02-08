import type { User, Post, CreatePostInput, UpdatePostInput, ApiResponse } from '../types';

// Simulated database
const users: User[] = [];
const posts: Post[] = [];

// ---- Auth Routes ----

export async function handleLogin(
  email: string,
  password: string
): Promise<ApiResponse<{ token: string; user: User }>> {
  const user = users.find(u => u.email === email);
  if (!user) {
    return { data: null as any, error: 'Invalid credentials' };
  }
  return {
    data: {
      token: 'mock-jwt-token',
      user,
    },
  };
}

export async function handleRegister(
  email: string,
  name: string,
  password: string
): Promise<ApiResponse<User>> {
  const newUser: User = {
    id: crypto.randomUUID(),
    email,
    name,
    createdAt: new Date(),
  };
  users.push(newUser);
  return { data: newUser };
}

// ---- Post Routes ----

export async function handleGetPosts(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<Post[]>> {
  const start = (page - 1) * limit;
  const paginated = posts.slice(start, start + limit);
  return {
    data: paginated,
    pagination: {
      page,
      total: posts.length,
      hasMore: start + limit < posts.length,
    },
  };
}

export async function handleCreatePost(
  authorId: string,
  input: CreatePostInput
): Promise<ApiResponse<Post>> {
  const post: Post = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    authorId,
    tags: input.tags || [],
    status: 'draft',
  };
  posts.push(post);
  return { data: post };
}

export async function handleUpdatePost(
  input: UpdatePostInput
): Promise<ApiResponse<Post>> {
  const post = posts.find(p => p.id === input.id);
  if (!post) {
    return { data: null as any, error: 'Post not found' };
  }
  if (input.title) post.title = input.title;
  if (input.content) post.content = input.content;
  if (input.tags) post.tags = input.tags;
  return { data: post };
}

export async function handleDeletePost(id: string): Promise<ApiResponse<boolean>> {
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) {
    return { data: false, error: 'Post not found' };
  }
  posts.splice(idx, 1);
  return { data: true };
}
