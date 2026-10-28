export function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <h1>AYLİN GEDİK</h1>
        <div className="hero-row">
          <p className="role">Yazılım geliştirici</p>
          <nav aria-label="Sayfa">
            <a href="#hizmetler">Hizmetler</a>
            <a href="#katalog">Katalog</a>
            <a href="#iletisim">İletişim</a>
          </nav>
        </div>
        <hr className="rule" />
        <p className="statement">Fikirleri Dijital Deneyimlere Dönüştürüyorum.</p>
        <p className="lede">
          Web siteleri ve mobil uygulamaları sade, hızlı ve kullanışlı arayüzlerle geliştiriyorum.
          Kapsam baştan netleşir; ortaya çalışan bir ürün çıkar.
        </p>
        <a className="text-link" href="#katalog">
          Proje türünü seç
        </a>
      </div>
    </header>
  );
}
