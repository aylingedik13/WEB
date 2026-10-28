import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiError, submitInquiry } from "../lib/api";
import { TYPE_LABEL, TYPE_QUESTION, hasErrors, validateInquiry, type FieldErrors, type InquiryInput } from "../lib/validate";
import type { Selection } from "../pages/Home";

const empty = {
  name: "",
  email: "",
  projectName: "",
  description: "",
  features: "",
  budget: "",
  company: "",
};

export function RequestForm({ selection }: { selection: Selection | null }) {
  const [fields, setFields] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const baseId = useId();

  useEffect(() => {
    if (!selection) return;
    if (selection.projectName) {
      setFields((current) => ({ ...current, projectName: selection.projectName }));
    }
    setNotice(null);
    document.getElementById("talep")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selection]);

  function update(key: keyof typeof empty, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const input: InquiryInput = { ...fields, projectType: selection ? selection.type : "" };
    const nextErrors = validateInquiry(input);
    setErrors(nextErrors);
    if (hasErrors(nextErrors) || sending.current) {
      if (hasErrors(nextErrors)) setNotice({ tone: "bad", text: "Formdaki alanları kontrol edin." });
      return;
    }
    sending.current = true;
    setPending(true);
    setNotice(null);
    try {
      await submitInquiry(input);
      setFields(empty);
      setErrors({});
      setNotice({ tone: "ok", text: "Talebiniz kaydedildi. En kısa sürede dönüş yapılır." });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setErrors(apiError?.fields ?? {});
      setNotice({
        tone: "bad",
        text: apiError?.message || "Talep kaydedilemedi.",
      });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  const question = selection ? TYPE_QUESTION[selection.type] : "Proje türünü seçin";

  return (
    <section className="request" id="talep" aria-labelledby="talep-baslik">
      <div className="wrap">
        {!selection ? (
          <div className="empty-form">
            <h2 id="talep-baslik">Proje talebi</h2>
            <p>Katalogdan web sitesi veya mobil uygulama seçin. Form burada açılır.</p>
            <a className="button" href="#katalog">
              Kataloğa dön
            </a>
          </div>
        ) : (
          <form className="form-layout" onSubmit={onSubmit} noValidate>
            <div>
              <p className="eyebrow">Talep formu</p>
              <h2 id="talep-baslik">Proje talebi</h2>
              <p className="type-badge">
                Proje türü: <strong>{TYPE_LABEL[selection.type]}</strong>
              </p>
              <p className="quiet">Ad, Gmail ve proje notunuz yalnızca yönetim paneline kaydedilir.</p>
            </div>
            <div className="fields">
              <div className="hp" aria-hidden="true">
                <label>
                  Şirket sitesi
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={fields.company}
                    onChange={(event) => update("company", event.target.value)}
                  />
                </label>
              </div>
              <label htmlFor={`${baseId}-name`}>
                Ad soyad
                <input
                  id={`${baseId}-name`}
                  name="name"
                  autoComplete="name"
                  value={fields.name}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${baseId}-name-err` : undefined}
                  onChange={(event) => update("name", event.target.value)}
                />
              </label>
              {errors.name && <p id={`${baseId}-name-err`} className="field-error">{errors.name}</p>}
              <label htmlFor={`${baseId}-email`}>
                Gmail
                <input
                  id={`${baseId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="adiniz@gmail.com"
                  value={fields.email}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${baseId}-email-err` : undefined}
                  onChange={(event) => update("email", event.target.value)}
                />
              </label>
              {errors.email && <p id={`${baseId}-email-err`} className="field-error">{errors.email}</p>}
              <label htmlFor={`${baseId}-description`}>
                {question}
                <textarea
                  id={`${baseId}-description`}
                  name="description"
                  rows={5}
                  value={fields.description}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? `${baseId}-description-err` : undefined}
                  onChange={(event) => update("description", event.target.value)}
                />
              </label>
              {errors.description && (
                <p id={`${baseId}-description-err`} className="field-error">{errors.description}</p>
              )}
              <label htmlFor={`${baseId}-project`}>
                Proje adı
                <input
                  id={`${baseId}-project`}
                  name="projectName"
                  value={fields.projectName}
                  aria-invalid={Boolean(errors.projectName)}
                  aria-describedby={errors.projectName ? `${baseId}-project-err` : undefined}
                  onChange={(event) => update("projectName", event.target.value)}
                />
              </label>
              {errors.projectName && (
                <p id={`${baseId}-project-err`} className="field-error">{errors.projectName}</p>
              )}
              <label htmlFor={`${baseId}-features`}>
                İstenen özellikler
                <textarea
                  id={`${baseId}-features`}
                  name="features"
                  rows={4}
                  value={fields.features}
                  aria-invalid={Boolean(errors.features)}
                  aria-describedby={errors.features ? `${baseId}-features-err` : undefined}
                  onChange={(event) => update("features", event.target.value)}
                />
              </label>
              {errors.features && (
                <p id={`${baseId}-features-err`} className="field-error">{errors.features}</p>
              )}
              <label htmlFor={`${baseId}-budget`}>
                Bütçe <span>(isteğe bağlı)</span>
                <input
                  id={`${baseId}-budget`}
                  name="budget"
                  value={fields.budget}
                  aria-invalid={Boolean(errors.budget)}
                  aria-describedby={errors.budget ? `${baseId}-budget-err` : undefined}
                  onChange={(event) => update("budget", event.target.value)}
                />
              </label>
              {errors.budget && <p id={`${baseId}-budget-err`} className="field-error">{errors.budget}</p>}
              {errors.projectType && <p className="field-error">{errors.projectType}</p>}
              <button className="button solid" type="submit" disabled={pending}>
                {pending ? "Kaydediliyor…" : "Talebi gönder"}
              </button>
              <div role="status" aria-live="polite" className={notice ? `notice ${notice.tone}` : "notice"}>
                {notice?.text}
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
