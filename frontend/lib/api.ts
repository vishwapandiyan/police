// PRISM-PY API Client

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('prism_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prism_token');
      localStorage.removeItem('prism_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || 'Request failed');
  }
  return data as T;
}

async function upload(path: string, file: File): Promise<Record<string, unknown>> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || 'Upload failed');
  return data;
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    request<{ token: string; user: import('./types').User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),
  me: () => request<import('./types').User>('/api/v1/auth/me'),
  users: () => request<{ users: import('./types').User[] }>('/api/v1/auth/users'),
};

// Dashboard
export const dashboard = {
  stats: () => request<import('./types').DashboardStats>('/api/v1/dashboard/stats'),
};

// Proposals
export const proposals = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ proposals: import('./types').Proposal[]; total: number }>(`/api/v1/proposals${q}`);
  },
  get: (id: string) =>
    request<{ proposal: import('./types').Proposal }>(`/api/v1/proposals/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{ proposal: import('./types').Proposal }>('/api/v1/proposals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Record<string, unknown>) =>
    request<{ proposal: import('./types').Proposal }>(`/api/v1/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  submit: (id: string, comment?: string) =>
    request(`/api/v1/proposals/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  approve: (id: string, comment?: string) =>
    request(`/api/v1/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  return: (id: string, reason: string) =>
    request(`/api/v1/proposals/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  reject: (id: string, reason: string) =>
    request(`/api/v1/proposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  history: (id: string) =>
    request<{ history: import('./types').DecisionAction[] }>(`/api/v1/proposals/${id}/history`),
  analyze: (id: string) =>
    request(`/api/v1/proposals/${id}/analyze`, { method: 'POST' }),
  dna: (id: string) =>
    request<import('./types').DNARecord>(`/api/v1/proposals/${id}/dna`),
  confirmDna: (id: string, confirmed: Record<string, unknown>) =>
    request(`/api/v1/proposals/${id}/dna`, {
      method: 'PATCH',
      body: JSON.stringify({ confirmed }),
    }),
  completeness: (id: string) =>
    request<import('./types').CompletenessCheck>(`/api/v1/proposals/${id}/completeness`, {
      method: 'POST',
    }),
  precedents: (id: string) =>
    request<{ precedents: import('./types').Precedent[]; total_found: number }>(`/api/v1/proposals/${id}/precedents`),
  policies: (id: string) =>
    request<{ policies: import('./types').PolicyResult[] }>(`/api/v1/proposals/${id}/policies`),
  procurement: (id: string) =>
    request(`/api/v1/proposals/${id}/procurement`),
  costAnalysis: (id: string) =>
    request<import('./types').CostAnalysis>(`/api/v1/proposals/${id}/cost-analysis`),
  overlap: (id: string) =>
    request(`/api/v1/proposals/${id}/overlap`, { method: 'POST' }),
  decisionBrief: (id: string) =>
    request<{ brief: Record<string, unknown> }>(`/api/v1/proposals/${id}/decision-brief`),
  generateBrief: (id: string) =>
    request<{ brief: Record<string, unknown> }>(`/api/v1/proposals/${id}/decision-brief`, { method: 'POST' }),
  audit: (id: string) =>
    request<{ events: import('./types').AuditEvent[] }>(`/api/v1/proposals/${id}/audit`),
};

// Documents
export const documents = {
  list: (proposalId: string) =>
    request<{ documents: import('./types').ProposalDocument[] }>(`/api/v1/proposals/${proposalId}/documents`),
  upload: (proposalId: string, file: File) =>
    upload(`/api/v1/proposals/${proposalId}/documents`, file),
};

// Search
export const search = {
  precedents: (query: string, topK = 10) =>
    request<{ precedents: import('./types').Precedent[]; total_found: number }>('/api/v1/search/precedents', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    }),
  policies: (query: string) =>
    request<{ policies: import('./types').PolicyResult[] }>('/api/v1/search/policies', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  procurement: (body: Record<string, unknown>) =>
    request('/api/v1/search/procurement', { method: 'POST', body: JSON.stringify(body) }),
  institutionalMemory: (query: string) =>
    request('/api/v1/institutional-memory/search', { method: 'POST', body: JSON.stringify({ query }) }),
};

// GeM
export const gem = {
  search: (body: Record<string, unknown>) =>
    request('/api/v1/gem/search', { method: 'POST', body: JSON.stringify(body) }),
  package: (body: Record<string, unknown>) =>
    request('/api/v1/gem/package', { method: 'POST', body: JSON.stringify(body) }),
  reference: (body: Record<string, unknown>) =>
    request('/api/v1/gem/reference', { method: 'POST', body: JSON.stringify(body) }),
  status: (proposalId: string) =>
    request(`/api/v1/proposals/${proposalId}/gem`),
  guidance: () => request('/api/v1/gem/guidance'),
};

// Implementation
export const implementation = {
  create: (proposalId: string, body: Record<string, unknown>) =>
    request(`/api/v1/proposals/${proposalId}/implementation`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  get: (proposalId: string) =>
    request<{ implementation: import('./types').ImplementationRecord }>(`/api/v1/proposals/${proposalId}/implementation`),
  update: (implId: string, body: Record<string, unknown>) =>
    request(`/api/v1/implementation/${implId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

// Outcomes
export const outcomes = {
  create: (proposalId: string, body: Record<string, unknown>) =>
    request(`/api/v1/proposals/${proposalId}/outcome`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  get: (proposalId: string) =>
    request<{ outcome: import('./types').OutcomeRecord }>(`/api/v1/proposals/${proposalId}/outcome`),
  addLesson: (proposalId: string, body: Record<string, unknown>) =>
    request(`/api/v1/proposals/${proposalId}/lesson`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// Audit
export const audit = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ events: import('./types').AuditEvent[]; total: number }>(`/api/v1/audit${q}`);
  },
};

// Health
export const health = {
  check: () => request<{ status: string }>('/health'),
};
