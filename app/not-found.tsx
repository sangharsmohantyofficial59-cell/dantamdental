import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="notfound">
      <div>
        <h1>Page not found</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          We could not find that page. It may have moved.
        </p>
        <Link className="btn primary" href="/">
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
