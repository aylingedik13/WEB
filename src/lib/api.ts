import type { FieldErrors, InquiryInput } from "./validate";

export type Inquiry = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  projectType: "web" | "mobile";
  projectName: string;
  description: string;
  features: string;
  budget: string | null;
};

type Payload = {
  message?: string;
  fields?: FieldErrors;
  inquiries?: Inquiry[];
};

export class ApiError extends Error {
  fields?: FieldErrors;
  status: number;

  constructor(message: string, status: number, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Gönderim servisi yanıt vermiyor.", 0);
  }
  const text = await response.text();
  if (text.length > 500_000) throw new ApiError("Sunucu beklenmeyen bir yanıt verdi.", response.status);
  let data: Payload = {};
  if (text) {
    try {
      data = JSON.parse(text) as Payload;
    } catch {
      throw new ApiError("Sunucu beklenmeyen bir yanıt verdi.", response.status);
    }
  }
  if (!response.ok) {
    throw new ApiError(data.message || "İşlem tamamlanamadı.", response.status, data.fields);
  }
  return data;
}

export function submitInquiry(input: InquiryInput) {
  return request("/api/inquiries", { method: "POST", body: JSON.stringify(input) });
}

export function login(password: string) {
  return request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
}

export function logout() {
  return request("/api/admin/logout", { method: "POST" });
}

export async function fetchInquiries() {
  const data = await request("/api/inquiries");
  return data.inquiries ?? [];
}
