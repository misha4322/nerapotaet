import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-left">
          <div className="footer-logo">🎮 GameHub</div>
          <div className="footer-muted">© 2026</div>
        </div>

        <div className="footer-links">
          <Link href="/about">О нас</Link>
          <Link href="/rules">Правила</Link>
          <Link href="/privacy">Конфиденциальность</Link>
        </div>
      </div>
    </footer>
  );
}
