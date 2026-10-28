import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>© {new Date().getFullYear()} Aylin Gedik</p>
        <p>Web sitesi ve mobil uygulama geliştirme</p>
        <Link to="/yonetim">Yönetim</Link>
      </div>
    </footer>
  );
}
