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

// Precedents Intelligence Workflow (Primary Proposal-Driven Pipeline)
export const precedents = {
  /**
   * Primary PRISM-PY workflow: The officer's proposal document drives the complete intelligence pipeline.
   * Uploads file (PDF, DOCX, TXT, PPTX, XLSX) or passes raw text / proposalId.
   */
  analyzeDocument: async (params: { file?: File; text?: string; proposalId?: string }) => {
    const token = getToken();
    const form = new FormData();
    if (params.file) form.append('file', params.file);
    if (params.text) form.append('text', params.text);
    if (params.proposalId) form.append('proposal_id', params.proposalId);

    const res = await fetch(`${API_BASE}/api/v1/precedents/analyze-document`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || 'Proposal precedent analysis failed');
    return data as import('./types').ProposalDocumentIntelligenceResult;
  },
  search: (query: string, topK = 10) =>
    request<{ precedents: import('./types').Precedent[]; total_found: number }>('/api/v1/search/precedents', {
      method: 'POST',
      body: JSON.stringify({ query, top_k: topK }),
    }),
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

// ── Procurement Workflow ──────────────────────────────────────────────────

export const procurementWorkflow = {

  // Approval matrix
  getApprovalMatrix: () =>
    request<{ matrix: Record<string, unknown>[] }>('/api/v1/approval-matrix'),

  getProposalApprovalLevel: (proposalId: string) =>
    request<Record<string, unknown>>(`/api/v1/proposals/${proposalId}/approval-level`),

  governmentApprove: (proposalId: string, body: { reference?: string; comment?: string }) =>
    request(`/api/v1/proposals/${proposalId}/government-approve`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Procurement Requirements
  createRequirement: (proposalId: string, body: Record<string, unknown>) =>
    request<{ requirement_id: string; requirement: Record<string, unknown> }>(
      `/api/v1/proposals/${proposalId}/procurement-requirement`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  getRequirement: (proposalId: string) =>
    request<{ requirements: Record<string, unknown>[] }>(
      `/api/v1/proposals/${proposalId}/procurement-requirement`
    ),
  updateRequirement: (reqId: string, body: Record<string, unknown>) =>
    request(`/api/v1/procurement-requirements/${reqId}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),

  // Procurement Events
  createEvent: (reqId: string, body: Record<string, unknown>) =>
    request<{ event_id: string; event: Record<string, unknown> }>(
      `/api/v1/procurement-requirements/${reqId}/events`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listEvents: (proposalId: string) =>
    request<{ events: Record<string, unknown>[] }>(
      `/api/v1/proposals/${proposalId}/procurement-events`
    ),
  getEvent: (eventId: string) =>
    request<{ event: Record<string, unknown> }>(
      `/api/v1/procurement-events/${eventId}`
    ),
  updateEventStatus: (eventId: string, body: Record<string, unknown>) =>
    request(`/api/v1/procurement-events/${eventId}/status`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),

  // Bids
  addBid: (eventId: string, body: Record<string, unknown>) =>
    request<{ bid_id: string; bid: Record<string, unknown> }>(
      `/api/v1/procurement-events/${eventId}/bids`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listBids: (eventId: string) =>
    request<{ bids: Record<string, unknown>[]; notice: string }>(
      `/api/v1/procurement-events/${eventId}/bids`
    ),
  qualifyBid: (evalId: string, bidId: string, status: string) =>
    request(`/api/v1/technical-evaluations/${evalId}/bids/${bidId}/qualify`, {
      method: 'PATCH', body: JSON.stringify({ qualification_status: status }),
    }),

  // Technical Evaluation
  createTechEval: (eventId: string, body: Record<string, unknown>) =>
    request<{ evaluation_id: string }>(
      `/api/v1/procurement-events/${eventId}/technical-evaluation`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  getTechEval: (eventId: string) =>
    request<{ evaluation: Record<string, unknown> }>(
      `/api/v1/procurement-events/${eventId}/technical-evaluation`
    ),
  addCommitteeMember: (evalId: string, body: Record<string, unknown>) =>
    request(`/api/v1/technical-evaluations/${evalId}/committee`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  addBidderEvalLine: (evalId: string, body: Record<string, unknown>) =>
    request(`/api/v1/technical-evaluations/${evalId}/bidder-evaluation`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  completeTechEval: (evalId: string, observations: string) =>
    request(`/api/v1/technical-evaluations/${evalId}/complete`, {
      method: 'PATCH', body: JSON.stringify({ overall_observations: observations }),
    }),

  // Financial Evaluation
  createFinEval: (eventId: string, body: Record<string, unknown>) =>
    request<{ evaluation_id: string; technically_qualified_count: number }>(
      `/api/v1/procurement-events/${eventId}/financial-evaluation`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  getFinEval: (eventId: string) =>
    request<{ evaluation: Record<string, unknown>; l1_notice: string }>(
      `/api/v1/procurement-events/${eventId}/financial-evaluation`
    ),
  recordL1: (evalId: string, body: { l1_bid_id: string; notes?: string }) =>
    request(`/api/v1/financial-evaluations/${evalId}/record-l1`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Purchase Orders
  createPO: (eventId: string, body: Record<string, unknown>) =>
    request<{ po_id: string; purchase_order: Record<string, unknown> }>(
      `/api/v1/procurement-events/${eventId}/purchase-order`,
      { method: 'POST', body: JSON.stringify(body) }
    ),
  listPOs: (proposalId: string) =>
    request<{ purchase_orders: Record<string, unknown>[] }>(
      `/api/v1/proposals/${proposalId}/purchase-orders`
    ),
  getPO: (poId: string) =>
    request<{ purchase_order: Record<string, unknown> }>(
      `/api/v1/purchase-orders/${poId}`
    ),
  updatePO: (poId: string, body: Record<string, unknown>) =>
    request(`/api/v1/purchase-orders/${poId}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),

  // Intelligence with provenance
  getIntelligenceWithProvenance: (proposalId: string) =>
    request<{ historical_tenders: Record<string, unknown>[]; provenance_notice: string }>(
      `/api/v1/proposals/${proposalId}/procurement-intelligence`
    ),
};

// ── RAG Pipeline Bridge ───────────────────────────────────────────────────

export const rag = {
  /** Check if Flask RAG pipeline is reachable via FastAPI proxy */
  health: () =>
    request<import('./types').RAGHealthStatus>('/api/v1/rag/health'),

  /** Natural language grounded RAG query */
  query: (question: string, mode = 'document_grounded', topK = 5) =>
    request<import('./types').RAGQueryResult>('/api/v1/rag/query', {
      method: 'POST',
      body: JSON.stringify({ question, mode, top_k: topK }),
    }),

  /** Direct search over synthetic demo index */
  demoSearch: (question: string, topK = 8) =>
    request<import('./types').RAGQueryResult>('/api/v1/rag/demo/search', {
      method: 'POST',
      body: JSON.stringify({ question, top_k: topK }),
    }),

  /** Check synthetic demo index status */
  demoStatus: () =>
    request<Record<string, unknown>>('/api/v1/rag/demo/status'),

  /** Extract DNA from text or stored doc */
  analyze: (documents: string, proposalId?: string) =>
    request<import('./types').RAGDnaResult>('/api/v1/rag/analyze', {
      method: 'POST',
      body: JSON.stringify({ documents, proposal_id: proposalId }),
    }),

  /** Generate Decision Brief */
  brief: (documents: string, proposalId?: string, topK = 5) =>
    request<import('./types').RAGDecisionBriefResult>('/api/v1/rag/brief', {
      method: 'POST',
      body: JSON.stringify({ documents, proposal_id: proposalId, top_k: topK }),
    }),

  /** Search precedents using Flask RAG retriever */
  searchPrecedents: (query: string, jurisdiction = 'all', domain?: string, topK = 10) =>
    request<Record<string, unknown>>('/api/v1/rag/precedents/search', {
      method: 'POST',
      body: JSON.stringify({ query, jurisdiction, domain, top_k: topK }),
    }),

  /** Run Flask RAG DNA extraction for a specific proposal loaded from DB */
  analyzeProposal: (proposalId: string) =>
    request<import('./types').RAGDnaResult>(`/api/v1/rag/proposals/${proposalId}/analyze`, {
      method: 'POST',
    }),

  /** Generate RAG-backed Decision Brief for a proposal loaded from DB */
  proposalBrief: (proposalId: string, topK = 5) =>
    request<import('./types').RAGDecisionBriefResult>(`/api/v1/rag/proposals/${proposalId}/brief`, {
      method: 'POST',
      body: JSON.stringify({ top_k: topK }),
    }),

  /** Upload document to Flask RAG */
  upload: (file: File) =>
    upload('/api/v1/rag/upload', file),

  /** Get detailed component status and stats from Flask RAG */
  status: () =>
    request<Record<string, unknown>>('/api/v1/rag/status'),

  /** Compare multiple precedents side-by-side using Flask RAG */
  comparePrecedents: (precedentIds: string[]) =>
    request<Record<string, unknown>>('/api/v1/rag/precedents/compare', {
      method: 'POST',
      body: JSON.stringify({ precedent_ids: precedentIds }),
    }),

  /** List all documents stored in Flask RAG */
  documents: () =>
    request<{ success: boolean; documents: Record<string, unknown>[]; total: number }>('/api/v1/rag/documents'),

  /** Get details of a stored document from Flask RAG */
  getDocument: (docId: string) =>
    request<{ success: boolean; document: Record<string, unknown> }>(`/api/v1/rag/documents/${docId}`),

  /** Get processing status of a document in Flask RAG */
  getDocumentStatus: (docId: string) =>
    request<{ success: boolean; document_id: string; status: string; stage?: string; progress_percentage: number }>(`/api/v1/rag/documents/${docId}/status`),

  /** Get chunks of a document in Flask RAG */
  getDocumentChunks: (docId: string) =>
    request<{ success: boolean; document_id: string; chunks: Record<string, unknown>[]; total_chunks: number }>(`/api/v1/rag/documents/${docId}/chunks`),

  /** Generate complete intelligence pack (Requirement -> Spec, Justification, Tender, Policy, Outcomes) */
  intelligencePack: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/intelligence/pack', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Get labelled catalogue and reference records */
  catalogue: () =>
    request<Record<string, unknown>>('/api/catalogue'),
};

