export default function AuthGate({ user, children }) {
  if (!user) return <p role="status">Iniciá sesión para ver tus datos.</p>;
  return children;
}
