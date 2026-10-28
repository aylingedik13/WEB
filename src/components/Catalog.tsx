import type { Selection } from "../pages/Home";
import type { ProjectType } from "../lib/validate";

const examples: Array<{ type: ProjectType; name: string }> = [
  { type: "web", name: "Kafe vitrin sitesi" },
  { type: "web", name: "Hizmet ve randevu sitesi" },
  { type: "mobile", name: "Sipariş takip uygulaması" },
  { type: "mobile", name: "Randevu uygulaması" },
  { type: "web", name: "Mimarlık Ofisi & Keşif Randevu Sitesi" },
  { type: "web", name: "E-Ticaret & Sipariş Takip Mağazası" },
  { type: "web", name: "QR Menü & Restoran Sipariş Sistemi" },
  { type: "web", name: "Diş Kliniği & Online Randevu Sitesi" },
  { type: "mobile", name: "Diyetisyen & Beslenme Mobil Uygulaması" },
  { type: "web", name: "Temizlik Şirketi & Rezervasyon Platformu" },
  { type: "web", name: "Emlak & Konut İlanları Web Sitesi" },
];

export function Catalog({
  selection,
  onChoose,
}: {
  selection: Selection | null;
  onChoose: (type: ProjectType, projectName?: string) => void;
}) {
  return (
    <section className="catalog" id="katalog" aria-labelledby="katalog-baslik">
      <div className="wrap">
        <h2 id="katalog-baslik">Proje kataloğu</h2>
        <p className="catalog-lead">Proje türü seç. Seçiminiz talep formuna kendiliğinden yazılır.</p>
        <div className="bubbles">
          <button
            type="button"
            className={selection?.type === "web" ? "is-on" : undefined}
            aria-pressed={selection?.type === "web"}
            onClick={() => onChoose("web")}
          >
            Web sitesi
          </button>
          <button
            type="button"
            className={selection?.type === "mobile" ? "is-on" : undefined}
            aria-pressed={selection?.type === "mobile"}
            onClick={() => onChoose("mobile")}
          >
            Mobil uygulama
          </button>
        </div>
        <div className="examples">
          <p>Örnek iş türleri</p>
          <ul>
            {examples.map((example) => (
              <li key={example.name}>
                <span>{example.name}</span>
                <button
                  type="button"
                  aria-pressed={selection?.projectName === example.name}
                  onClick={() => onChoose(example.type, example.name)}
                >
                  Teklif Al
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
