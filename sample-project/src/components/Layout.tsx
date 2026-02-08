import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/posts">Posts</a>
          {user ? (
            <div className="user-menu">
              <span>{user.name}</span>
              <button onClick={logout}>Logout</button>
            </div>
          ) : (
            <a href="/login">Login</a>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        <p>&copy; 2026 Sample App</p>
      </footer>
    </div>
  );
}
