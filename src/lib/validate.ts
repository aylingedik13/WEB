export type ProjectType = "web" | "mobile";

export type InquiryInput = {
  name: string;
  email: string;
  projectType: ProjectType | "";
  projectName: string;
  description: string;
  features: string;
  budget: string;
  company: string;
};

export type FieldErrors = Partial<Record<keyof InquiryInput, string>>;

const EMAIL = /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i;
const PERSON = /^[\p{L}][\p{L}'.-]*(?:\s+[\p{L}][\p{L}'.-]*)+$/u;

export const TYPE_LABEL: Record<ProjectType, string> = {
  web: "Web sitesi",
  mobile: "Mobil uygulama",
};

export const TYPE_QUESTION: Record<ProjectType, string> = {
  web: "Web sitesi projesinde neler istiyorsunuz?",
  mobile: "Mobil uygulama projesinde neler istiyorsunuz?",
};

export function normalizeInquiry(raw: InquiryInput): InquiryInput {
  return {
    name: raw.name.trim().replace(/\s+/g, " "),
    email: raw.email.trim().toLowerCase(),
    projectType: raw.projectType,
    projectName: raw.projectName.trim().replace(/\s+/g, " "),
    description: raw.description.trim(),
    features: raw.features.trim(),
    budget: raw.budget.trim(),
    company: raw.company.trim(),
  };
}

export function validateInquiry(raw: InquiryInput): FieldErrors {
  const input = normalizeInquiry(raw);
  const errors: FieldErrors = {};

  if (!PERSON.test(input.name) || input.name.length > 80 || input.name.split(" ").some((part) => part.length < 2)) {
    errors.name = "Ad ve soyadı birlikte yazın.";
  }
  if (!EMAIL.test(input.email)) {
    errors.email = "Geçerli bir Gmail adresi yazın.";
  }
  if (input.projectType !== "web" && input.projectType !== "mobile") {
    errors.projectType = "Web sitesi veya mobil uygulama seçin.";
  }
  if (input.projectName.length < 2 || input.projectName.length > 120) {
    errors.projectName = "Proje adını yazın.";
  }
  if (input.description.length < 20 || input.description.length > 2000) {
    errors.description = "Projenizi en az 20 karakterle anlatın.";
  }
  if (input.features.length < 10 || input.features.length > 2000) {
    errors.features = "İstediğiniz özellikleri yazın.";
  }
  if (input.budget.length > 40) {
    errors.budget = "Bütçe notu en fazla 40 karakter olabilir.";
  }
  return errors;
}

export function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}
