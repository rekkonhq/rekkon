import { usePosts } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';
import { formatDate, truncate } from '../lib/formatters';
import type { Post } from '../types';

// ---- PostCard Component ----

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  return (
    <div className="post-card">
      <h3>{post.title}</h3>
      <p>{truncate(post.content, 200)}</p>
      <div className="post-meta">
        <span>{formatDate(post.publishedAt || new Date())}</span>
        <div className="tags">
          {post.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
      {onDelete && (
        <button onClick={() => onDelete(post.id)}>Delete</button>
      )}
    </div>
  );
}

// ---- PostList Component ----

interface PostListProps {
  page?: number;
}

export function PostList({ page = 1 }: PostListProps) {
  const { posts, isLoading, error, deletePost } = usePosts(page);
  const { user } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="post-list">
      <h2>Posts</h2>
      {user && <p>Welcome, {user.name}</p>}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={user ? deletePost : undefined}
        />
      ))}
    </div>
  );
}

// ---- CreatePostForm Component ----

export function CreatePostForm() {
  const { createPost } = usePosts();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createPost('New Post', 'Content here...');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Title" />
      <textarea placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
