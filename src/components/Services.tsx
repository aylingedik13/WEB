import type { ProjectType } from "../lib/validate";

const items: Array<{
  type: ProjectType;
  index: string;
  title: string;
  text: string;
  points: string[];
}> = [
  {
    type: "web",
    index: "01",
    title: "Web sitesi geliştirme",
    text: "Tanıtım, katalog ve talep toplayan siteler. Sayfalar telefonda da rahat okunur, menü kaybolmaz.",
    points: ["Tanıtım ve katalog sayfaları", "Mobil uyumlu arayüz", "İletişim ve talep formu"],
  },
  {
    type: "mobile",
    index: "02",
    title: "Mobil uygulama geliştirme",
    text: "Telefona göre kurulmuş akışlar. Az ekran, net düğmeler ve işinize yarayan özellikler.",
    points: ["Sipariş ve randevu akışları", "Sade gezinme", "İhtiyaca göre bildirim ve form"],
  },
];

export function Services({ onChoose }: { onChoose: (type: ProjectType) => void }) {
  return (
    <section className="services" id="hizmetler" aria-labelledby="hizmetler-baslik">
      <div className="wrap">
        <h2 id="hizmetler-baslik">Hizmetler</h2>
        <div className="service-list">
          {items.map((item) => (
            <article key={item.type}>
              <p className="index">{item.index}</p>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => onChoose(item.type)}>
                  Bu hizmeti seç
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
