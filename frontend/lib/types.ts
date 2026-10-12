// PRISM-PY Type Definitions

export interface User {
  id: string;
  username: string;
  display_name: string;
  email?: string;
  role: string;
  department?: string;
  unit?: string;
  permissions?: string[];
}

export interface AuthSession {
  token: string;
  user: User;
}

export type ProposalStatus =
  | 'DRAFT'
  | 'ANALYZING'
  | 'ANALYSIS_COMPLETE'
  | 'SUBMITTED_FOR_REVIEW'
  | 'RETURNED_FOR_MODIFICATION'
  | 'RESUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCUREMENT'
  | 'IMPLEMENTATION'
  | 'COMPLETED'
  | 'CLOSED'
  | 'ARCHIVED';

export type ProposalCategory =
  | 'technology'
  | 'infrastructure'
  | 'procurement'
  | 'training'
  | 'vehicles'
  | 'communication'
  | 'operational'
  | 'administrative'
  | 'welfare'
  | 'other';

export interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  description?: string;
  department?: string;
  unit?: string;
  region?: string;
  station?: string;
  category?: ProposalCategory;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: ProposalStatus;
  estimated_cost?: number;
  currency: string;
  quantity?: string;
  purpose?: string;
  problem_statement?: string;
  expected_outcome?: string;
  technology?: string;
  specification?: string;
  expected_completion_date?: string;
  created_by?: string;
  current_owner?: string;
  analysis_status: string;
  classification: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  synthetic: boolean;
  document_count?: number;
}

export interface DashboardStats {
  kpis: {
    total_proposals: number;
    draft: number;
    submitted: number;
    under_review: number;
    approved: number;
    rejected: number;
    returned: number;
    in_procurement: number;
    in_implementation: number;
    completed: number;
    total_outcomes: number;
  };
  recent_proposals: Proposal[];
  recent_activity: ActivityEvent[];
  by_status: Record<string, number>;
  data_note: string;
}

export interface ActivityEvent {
  id: string;
  action: string;
  actor?: string;
  object_type?: string;
  object_id?: string;
  detail?: string;
  created_at?: string;
}

export interface ProposalDocument {
  id: string;
  document_id?: string;
  filename: string;
  document_type: string;
  uploaded_by?: string;
  uploaded_at?: string;
  processing_status: string;
}

export interface DNARecord {
  ai_extracted: Record<string, unknown>;
  confirmed: Record<string, unknown>;
  confirmed_by?: string;
  confirmed_at?: string;
  completeness_score: number;
  missing_fields: string[];
}

export interface CompletenessCheck {
  completeness_percentage: number;
  overall_status: 'PASS' | 'WARNING' | 'FAIL';
  score: number;
  total: number;
  checks: {
    field: string;
    label: string;
    status: 'PASS' | 'FAIL';
    value?: string;
    why_it_matters: string;
    how_to_fix: string;
  }[];
  summary: string;
}

export interface Precedent {
  rank: number;
  id: string;
  proposal_id?: string;
  title: string;
  match_score: number;
  jurisdiction_ring: number;
  jurisdiction_label: string;
  why_match: Record<string, string>;
  excerpt: string;
  document_type?: string;
  source_filename?: string;
  synthetic: boolean;
}

export interface PolicyResult {
  id?: string;
  title: string;
  record_type?: string;
  issuer?: string;
  excerpt: string;
  effective_status?: string;
  validity_warning?: string;
  match_kind?: string;
  official?: boolean;
  synthetic?: boolean;
  score?: number;
}

export interface GeMSearchResult {
  product: string;
  category: string;
  specification_summary: string;
  quantity?: string;
  observed_price_inr?: number;
  procurement_mode?: string;
  observed_at?: string;
  source: string;
  source_type: string;
  warranty?: string;
  delivery?: string;
  synthetic: boolean;
}

export interface CostAnalysis {
  proposed_cost?: number;
  currency: string;
  equipment_class: string;
  historical_min?: number;
  historical_median?: number;
  historical_max?: number;
  sample_size: number;
  variance_percentage?: number;
  is_significant_variance: boolean;
  variance_signal?: string;
  tenders: {
    id: string;
    title: string;
    year?: number;
    quantity?: string;
    amount_inr?: number;
    procurement_type?: string;
    synthetic: boolean;
  }[];
  limitations: string[];
}

export interface DecisionAction {
  id: string;
  action: string;
  previous_status: string;
  new_status: string;
  officer_name?: string;
  comment?: string;
  reason?: string;
  created_at?: string;
}

export interface ImplementationRecord {
  id: string;
  proposal_id: string;
  status: string;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  planned_cost?: number;
  actual_cost?: number;
  planned_quantity?: string;
  delivered_quantity?: string;
  responsible_unit?: string;
  issues?: string;
  observations?: string;
  updates: {
    id: string;
    update_type: string;
    note: string;
    updated_by?: string;
    created_at?: string;
  }[];
  synthetic: boolean;
}

export interface OutcomeRecord {
  id: string;
  outcome_status: string;
  actual_cost?: number;
  actual_duration?: string;
  success_metrics?: string;
  observations?: string;
  benefits?: string;
  failures?: string;
  verified: boolean;
  lessons: {
    id: string;
    title: string;
    lesson_text: string;
    category?: string;
  }[];
}

export interface AuditEvent {
  id: string;
  action: string;
  actor?: string;
  object_type?: string;
  object_id?: string;
  detail?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  result: string;
  created_at?: string;
}

export interface ApiError {
  detail: string;
}

// RAG Pipeline Types
export interface RAGHealthStatus {
  rag_pipeline: 'online' | 'offline' | 'error';
  flask_url?: string;
  status?: string;
  service?: string;
  demo_index_ready?: boolean;
  flask_response?: Record<string, unknown>;
  message?: string;
  detail?: string;
}

export interface RAGSourceChunk {
  rank: number;
  score: number;
  chunk_id?: string;
  document_id?: string;
  proposal_id?: string;
  source_filename?: string;
  source_location?: string;
  chunk_sequence?: number;
  text?: string;
  synthetic?: boolean;
  data_classification?: string;
}

export interface RAGQueryResult {
  success: boolean;
  question: string;
  mode?: string;
  answer: string;
  sources: RAGSourceChunk[];
  citations?: string[];
  retrieved_count: number;
  synthetic_only?: boolean;
  data_classification?: string;
  timestamp?: string;
  error?: string;
}

export interface RAGDecisionBriefResult {
  success: boolean;
  proposal_id: string;
  brief: {
    title?: string;
    proposal_summary?: string;
    precedents_count?: number;
    review_signals_count?: number;
    high_priority_signals?: number;
    processing_time_seconds?: number;
    missing_information?: string[];
    top_precedents?: Array<{
      document_id?: string;
      title?: string;
      document_title?: string;
      similarity_score?: number;
      excerpt?: string;
      source_reference?: string;
      match_reason?: string;
      synthetic?: boolean;
    }>;
    review_signals?: Array<{
      signal_type?: string;
      severity?: string;
      title?: string;
      description?: string;
      recommendation?: string;
    }>;
    sections?: Record<string, unknown>;
    overall_confidence?: string;
    confidence_note?: string;
    notice?: string;
    [key: string]: unknown;
  };
  executive_summary?: string;
  timestamp?: string;
  error?: string;
}

export interface RAGDnaResult {
  success?: boolean;
  proposal_id?: string;
  dna?: Record<string, unknown>;
  completeness_score?: number;
  extracted_fields?: Record<string, unknown>;
  missing_fields?: string[];
  [key: string]: unknown;
}

export interface ProposalDocumentIntelligenceResult {
  success: boolean;
  document_info: {
    filename: string;
    size: number;
    mime_type: string;
    characters_extracted: number;
    status: string;
  };
  proposal_dna: {
    title: string;
    department: string;
    requesting_unit: string;
    location: string;
    police_station: string;
    jurisdiction: string;
    requirement: string;
    objective: string;
    technology: string;
    quantity: string;
    budget: string;
    timeline: string;
    procurement_type: string;
    expected_outcomes: string;
    missing_fields: string[];
  };
  precedents: Array<{
    rank: number;
    proposal_id: string;
    title: string;
    unit: string;
    location: string;
    requirement: string;
    budget: string;
    decision: string;
    outcome: string;
    relevance_score: number;
    why_match: Record<string, string>;
    excerpt: string;
    source_filename?: string;
    citation?: string;
    synthetic: boolean;
  }>;
  policies: Array<PolicyResult>;
  procurement: {
    equipment_class?: string;
    historical_tenders?: Array<{
      tender_id?: string;
      proposal_id?: string;
      title?: string;
      procurement_type?: string;
      quantity?: string;
      indicative_amount_inr?: number;
      decision_status?: string;
      year?: number;
      location?: string;
      specification_summary?: string;
      historical_bidders?: Array<{
        display_name: string;
        quoted_amount_inr?: number;
        result?: string;
      }>;
    }>;
    indicative_price_summary?: {
      sample_size?: number;
      min_inr?: number;
      max_inr?: number;
      median_inr?: number;
      limitation?: string;
    };
    notice?: string;
  };
  historical_outcomes: Array<{
    title: string;
    lesson: string;
    category: string;
    source: string;
  }>;
  risk_signals: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    recommendation?: string;
  }>;
  evidence_sources: Array<{
    rank: number;
    chunk_id?: string;
    proposal_id?: string;
    source_filename?: string;
    score?: number;
    excerpt: string;
  }>;
  decision_brief: {
    title: string;
    executive_summary: string;
    precedents_count: number;
    review_points: string[];
    governance_notice: string;
  };
  data_classification: string;
  timestamp: string;
}

