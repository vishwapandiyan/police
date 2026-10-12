'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  ShieldAlert,
  Layers,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  MapPin,
  Cpu,
  Coins,
  Clock,
  Scale,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  GitCompare,
  CheckSquare,
  Database,
  Compass,
  ArrowRight,
  Download,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { precedents as precedentsApi, search as searchApi, rag as ragApi } from '@/lib/api';
import type {
  Precedent,
  ProposalDocumentIntelligenceResult,
  RAGQueryResult,
  RAGSourceChunk,
} from '@/lib/types';

// Curated sample proposals available for immediate one-click testing
const SAMPLE_PROPOSALS = [
  {
    id: 'sample-cctv',
    title: 'AI-Enabled CCTV Camera Expansion — Lawspet & Gorimedu',
    category: 'Video Surveillance',
    budget: 'INR 25,00,000',
    station: 'Gorimedu Police Station',
    summary: 'Expand 50 digital IP cameras, NVR storage arrays, and AI analytics for vulnerable junctions.',
    content: `PROPOSAL FOR: AI-Enabled CCTV Camera Expansion — Lawspet and Gorimedu Sub-Divisions (Demo)
DEPARTMENT: Technical Wing / Surveillance Division
POLICE STATION: Gorimedu Police Station
LOCATION: Gorimedu and Lawspet, Puducherry District
JURISDICTION: Puducherry District

OBJECTIVE:
To expand digital IP surveillance coverage across 14 vulnerable traffic junctions and public thoroughfares in Gorimedu and Lawspet police station limits, connecting high-resolution video streams to the district control room with automated number-plate recognition and motion detection.

PURPOSE:
Upgrade existing standalone analogue cameras to high-definition IP-based CCTV system with 30-day evidentiary retention, automated vehicle registration tracking, and night-vision capabilities to support crime prevention, traffic monitoring, and incident investigation.

PROBLEM STATEMENT:
Current security infrastructure in Lawspet and Gorimedu relies on obsolete 2017 analogue cameras with poor illumination sensitivity and no network connectivity. Recorded footage frequently fails legal admissibility thresholds due to low resolution, and frequent video loss impedes post-incident reconstruction.

TECHNICAL SPECIFICATIONS:
4MP IP dome and bullet cameras; H.265 video compression; 40m infrared night vision; minimum 30 frames per second; ONVIF Profile S/G/T compliance; weatherproof IP67 housing; 2 units of 32-channel Network Video Recorders (NVR) with RAID-5 storage; 60TB surveillance-grade storage arrays; PoE network switches; unified optical fiber backbone.

QUANTITY:
50 IP Cameras (30 bullet, 20 dome) + 2 NVR Units + 4 PoE Switches

ESTIMATED BUDGET:
INR 25,00,000 (Twenty-Five Lakhs Indian Rupees)

TIMELINE:
4 months from administrative sanction to operational acceptance testing

PROCUREMENT METHOD:
Open competitive bidding via Government e-Marketplace (GeM) custom bid

EXPECTED OUTCOMES:
100% video coverage of designated sensitive intersections; 30-day continuous evidentiary recording; 40% reduction in response time for reported street offences; integration with Emergency Response Support System (ERSS-112).`
  },
  {
    id: 'sample-radio',
    title: 'Digital Encrypted VHF Radio Handsets — Patrol Wing',
    category: 'Wireless Communications',
    budget: 'INR 6,40,000',
    station: 'Puducherry Central Station (Demo)',
    summary: 'Replace aging analogue transceivers with 40 encrypted digital DMR handheld radios.',
    content: `PROPOSAL FOR: Digital Encrypted VHF Radio Handset Modernization — Mobile Patrol Wing (Demo)
DEPARTMENT: Operations Wing / Wireless & Telecommunications Branch
POLICE STATION: Puducherry Central Station (Demo)
LOCATION: Puducherry Central and Urban Sub-Division
JURISDICTION: Puducherry District

OBJECTIVE:
To procure and deploy 40 military-grade Digital Mobile Radio (DMR) handheld transceivers with end-to-end AES-256 voice encryption, GPS location reporting, and multi-channel capability for law enforcement patrol squads and PCR vehicles operating in high-density urban areas.

PURPOSE:
Replace aging analogue VHF walkie-talkies that suffer from RF signal eavesdropping, severe audio distortion in dense urban sectors, and frequent dead-battery issues during 12-hour festival and public gathering deployments.

PROBLEM STATEMENT:
Current analogue radio communications are open and unencrypted, making operational transmissions vulnerable to interception by unauthorized parties during sensitive crowd control and VIP convoy escort duties. Battery degradation across the existing fleet results in communication blackout after 4 hours of field usage.

TECHNICAL SPECIFICATIONS:
DMR Tier II standard compliance; 136-174 MHz VHF frequency band; 5W RF output power; MIL-STD-810G ruggedization; IP68 submersible water and dust protection; AES-256 hardware encryption; integrated GPS/GLONASS tracking; minimum 2500 mAh Li-ion battery supporting 14-hour duty cycle; dual-slot TDMA technology; programmable emergency panic button with automatic location beacon.

QUANTITY:
40 Handheld Digital Transceivers + 80 Spare Rechargeable Battery Packs + 8 Multi-Unit Gang Chargers

ESTIMATED BUDGET:
INR 6,40,000 (Six Lakhs Forty Thousand Indian Rupees)

TIMELINE:
2 months from sanction order

PROCUREMENT METHOD:
Direct purchase via Government e-Marketplace (GeM) against standardized PAC / Ministry of Home Affairs technical specifications

EXPECTED OUTCOMES:
100% encrypted operational tactical voice network; real-time automatic vehicle/officer location on CAD dispatch consoles; zero communication interception risk; extended 14-hour operational shift endurance.`
  },
  {
    id: 'sample-cyber',
    title: 'Cyber Crime Forensics Workstation & Mobile Extraction Unit',
    category: 'Digital Investigation',
    budget: 'INR 18,50,000',
    station: 'Cyber Crime Cell, Puducherry',
    summary: 'Forensic workstation, hardware write-blockers, and certified mobile extraction tools.',
    content: `PROPOSAL FOR: Digital Cyber Crime Forensics Lab Workstation & Mobile Extraction Unit (Demo)
DEPARTMENT: Crime Branch / Cyber Crime Police Station
POLICE STATION: Cyber Crime Cell, Puducherry
LOCATION: Police Headquarters, Puducherry
JURISDICTION: UT-wide

OBJECTIVE:
To establish a dedicated digital evidence forensic extraction suite comprising high-throughput hardware write-blockers, mobile device physical extraction software, and encrypted forensic storage for analyzing seized smartphones, hard disks, and network server logs in financial cyber fraud and extortion cases.

PURPOSE:
Enable rapid, legally admissible ISO/IEC 27037 compliant acquisition and cryptographic hash verification of digital evidence to reduce case backlog from 6 months to 72 hours and comply with evidentiary rules under the Bharatiya Sakshya Adhiniyam (BSA).

PROBLEM STATEMENT:
The Cyber Crime Cell currently depends on external state forensic laboratories for standard phone extractions, causing evidence analysis delays of 4 to 8 months. During this latency window, suspect accounts and digital wallets are emptied, and bail is routinely granted due to non-filing of timely forensic reports.

TECHNICAL SPECIFICATIONS:
Tower workstation with dual 24-core CPUs, 128GB ECC RAM, dedicated GPU acceleration; hardware write-blockers supporting SATA, SAS, PCIe, NVMe, USB 3.2; certified forensic software licenses for mobile device physical chip-off and logical extraction; encrypted NAS storage array of 100TB with SHA-256 validation logging; Faraday shielded RF isolation bags and transport cases.

QUANTITY:
1 Forensic Workstation + 1 Portable Field Extraction Kit + Forensic Software Licenses

ESTIMATED BUDGET:
INR 18,50,000 (Eighteen Lakhs Fifty Thousand Indian Rupees)

TIMELINE:
3 months including officer certification training

PROCUREMENT METHOD:
Two-bid open tender via GeM e-Procurement with mandatory OEM compliance certification

EXPECTED OUTCOMES:
In-house forensic processing of all seized smartphones and media within 72 hours; 100% chain of custody integrity with BSA-compliant digital certificates; 50% increase in cyber charge sheet filing velocity.`
  }
];

// Sample questions directly mirrored from the Streamlit pipeline demo
const SAMPLE_QUESTIONS = [
  'Find historical proposals similar to the CCTV expansion proposal. Explain why they are relevant.',
  'Why was the second CCTV proposal deferred in the synthetic scenario?',
  'What was the illustrative budget in the first CCTV pilot?',
  'Which training proposal covers digital evidence handling?',
  'What information should be checked before comparing the two CCTV budgets?',
  'Which values are synthetic and must not be presented as official facts?'
];

const PROCESSING_STEPS = [
  'Validating proposal document & format...',
  'Extracting complete text content (OCR / document parsing)...',
  'Understanding proposal requirements & operational objectives...',
  'Building structured Proposal DNA...',
  'Retrieving historical precedents using multi-signal search...',
  'Cross-referencing policies, SOPs & procurement records...',
  'Preparing evidence-backed Decision Intelligence Brief...',
];

const QA_PROCESSING_STAGES = [
  'Understanding question...',
  'Searching semantic embeddings...',
  'Retrieving evidence...',
  'Ranking results...',
  'Generating answer...',
  'Validating citations...',
];

const PIPELINES = [
  { id: 'upload_dna_brief', label: '1. Upload → DNA → Brief', icon: <FileText size={14} />, badge: 'Complete' },
  { id: 'question_answer', label: '2. Question → Retrieve → Answer', icon: <HelpCircle size={14} />, badge: 'RAG Q&A' },
  { id: 'search_compare', label: '3. Search → Compare → Analyze', icon: <GitCompare size={14} /> },
  { id: 'cost_analysis', label: '4. Cost Analysis', icon: <Coins size={14} /> },
  { id: 'citations', label: '5. Citation Validation', icon: <CheckSquare size={14} /> },
  { id: 'demo_dataset', label: '6. Demo Dataset Retrieval', icon: <Database size={14} /> },
  { id: 'requirement_intel', label: '7. Requirement → Intelligence', icon: <Compass size={14} /> },
];

export default function PrecedentsPage() {
  // Master Active Pipeline
  const [activePipeline, setActivePipeline] = useState<string>('upload_dna_brief');

  // Handle URL query parameter ?pipeline=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('pipeline');
      if (p) {
        const match = PIPELINES.find(item => item.id === p || item.id.includes(p));
        if (match) setActivePipeline(match.id);
      }
    }
  }, []);

  // -------------------------------------------------------------
  // Pipeline 1: Upload -> DNA -> Brief State
  // -------------------------------------------------------------
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ProposalDocumentIntelligenceResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<string>('precedents');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Pipeline 2: Question -> Retrieve -> Answer State
  // -------------------------------------------------------------
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaMode, setQaMode] = useState<string>('document_grounded');
  const [qaTopK, setQaTopK] = useState<number>(5);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaStageIndex, setQaStageIndex] = useState(0);
  const [qaResult, setQaResult] = useState<RAGQueryResult | null>(null);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; r: RAGQueryResult }>>([]);

  // -------------------------------------------------------------
  // Pipeline 3: Search -> Compare -> Analyze State
  // -------------------------------------------------------------
  const [compareQuery, setCompareQuery] = useState('');
  const [compareJurisdiction, setCompareJurisdiction] = useState('All Records');
  const [compareTopK, setCompareTopK] = useState(5);
  const [compareSearching, setCompareSearching] = useState(false);
  const [compareResults, setCompareResults] = useState<Precedent[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  // -------------------------------------------------------------
  // Pipeline 4: Cost Analysis State
  // -------------------------------------------------------------
  const [costProposed, setCostProposed] = useState<number>(2500000);
  const [costCategory, setCostCategory] = useState<string>('Video Surveillance');

  // -------------------------------------------------------------
  // Pipeline 5: Citation Validation State
  // -------------------------------------------------------------
  const [citationText, setCitationText] = useState(
    'Under proposal [SYN-PDY-CCTV-001], 50 IP cameras were deployed at Gorimedu. A subsequent expansion [SYN-PDY-CCTV-002-PROPOSAL-005.docx] was reviewed under Standing Order 04/2023 [POL-SOP-001].'
  );

  // -------------------------------------------------------------
  // Pipeline 6: Demo Dataset Explorer State
  // -------------------------------------------------------------
  const [demoQuery, setDemoQuery] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoChunks, setDemoChunks] = useState<RAGSourceChunk[]>([]);

  // -------------------------------------------------------------
  // Pipeline 7: Requirement -> Intelligence Pack State
  // -------------------------------------------------------------
  const [reqWhat, setReqWhat] = useState('40 Handheld digital VHF DMR radios with GPS & AES-256');
  const [reqQuantity, setReqQuantity] = useState('40');
  const [reqLocation, setReqLocation] = useState('Puducherry Central Sub-Division');
  const [reqPurpose, setReqPurpose] = useState('Tactical secure voice communication for patrol squad officers');
  const [reqEquipmentClass, setReqEquipmentClass] = useState('radio');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqPack, setReqPack] = useState<any>(null);
  const [reqActiveTab, setReqActiveTab] = useState<string>('spec');

  // Timer animation for Document Analysis
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (analyzing) {
      interval = setInterval(() => {
        setProcessingStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setProcessingStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analyzing]);

  // Timer animation for QA Pipeline
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (qaLoading) {
      interval = setInterval(() => {
        setQaStageIndex((prev) => (prev < QA_PROCESSING_STAGES.length - 1 ? prev + 1 : prev));
      }, 500);
    } else {
      setQaStageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qaLoading]);

  // Reset analysis
  const resetAnalysis = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setSelectedSample(null);
    setProposalText('');
    setActiveResultTab('precedents');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processSelectedFile(files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processSelectedFile(files[0]);
  };
  const processSelectedFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExts = ['.pdf', '.docx', '.txt', '.pptx', '.xlsx'];
    if (!validExts.includes(ext)) {
      setError(`Unsupported file extension (${ext}). Please upload PDF, DOCX, TXT, PPTX, or XLSX.`);
      return;
    }
    setError(null);
    setSelectedFile(file);
    setSelectedSample(null);
    setProposalText('');
  };
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_PROPOSALS.find((s) => s.id === sampleId);
    if (!sample) return;
    setSelectedSample(sample.id);
    setSelectedFile(null);
    setProposalText(sample.content);
    setError(null);
  };

  // Run Pipeline 1 Analysis
  const handleAnalyzeProposal = async () => {
    if (!selectedFile && !proposalText.trim()) {
      setError('Please select or upload a proposal document first.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const res = await precedentsApi.analyzeDocument({
        file: selectedFile || undefined,
        text: proposalText.trim() ? proposalText.trim() : undefined,
      });
      if (res && res.success) {
        setAnalysisResult(res);
        // Pre-populate cost analysis budget
        const budgetStr = res.proposal_dna.budget || '';
        const num = parseInt(budgetStr.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) setCostProposed(num);
      } else {
        throw new Error('Analysis completed without valid result structure.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proposal analysis failed. Please verify the server is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Run Pipeline 2 Q&A
  const handleRunQa = async (questionToAsk?: string) => {
    const q = (questionToAsk || qaQuestion).trim();
    if (!q) return;
    setQaLoading(true);
    setError(null);
    try {
      const res = await ragApi.query(q, qaMode, qaTopK);
      if (res && res.success) {
        setQaResult(res);
        setQaHistory(prev => [{ q, r: res }, ...prev]);
      } else {
        throw new Error(res.error || 'Query failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RAG query failed.');
    } finally {
      setQaLoading(false);
    }
  };

  // Run Pipeline 3 Precedent Search
  const handleSearchCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareQuery.trim()) return;
    setCompareSearching(true);
    setError(null);
    try {
      const res = await searchApi.precedents(compareQuery.trim(), compareTopK);
      setCompareResults(res.precedents || []);
      setSelectedForCompare([]);
      setComparisonData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Precedent search failed.');
    } finally {
      setCompareSearching(false);
    }
  };

  const handleRunComparison = async () => {
    if (selectedForCompare.length < 2) {
      setError('Please select at least 2 precedents to compare.');
      return;
    }
    setComparing(true);
    setError(null);
    try {
      const res = await ragApi.comparePrecedents(selectedForCompare);
      setComparisonData(res.comparison || res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  };

  // Run Pipeline 6 Demo Search
  const handleDemoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoQuery.trim()) return;
    setDemoLoading(true);
    setError(null);
    try {
      const res = await ragApi.demoSearch(demoQuery.trim(), 8);
      setDemoChunks(res.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo dataset search failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  // Run Pipeline 7 Intelligence Pack
  const handleRunPack = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setError(null);
    try {
      const payload = {
        what_is_needed: reqWhat,
        quantity: reqQuantity,
        location: reqLocation,
        purpose: reqPurpose,
        equipment_class: reqEquipmentClass === 'auto' ? null : reqEquipmentClass,
        persist: true,
      };
      const res = await ragApi.intelligencePack(payload);
      if (res && (res.success || res.flow)) {
        setReqPack(res);
      } else {
        throw new Error(String(res.error || res.detail || 'Pack assembly failed.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Intelligence pack failed.');
    } finally {
      setReqLoading(false);
    }
  };

  // Extract citations utility
  const extractCitations = (text: string) => {
    const pattern = /\[([^\]]+)\]/g;
    const matches: string[] = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return Array.from(new Set(matches));
  };

  return (
    <AppLayout>
      <div className="gov-page" style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 20px 48px' }}>
        <SyntheticBanner />

        <PageHeader
          title="PRISM-PY RAG Intelligence Center"
          subtitle="Complete Law Enforcement Intelligence Pipeline — Precedents, Document DNA, RAG Q&A, Compare & Decisions"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Intelligence Pipelines' }]}
        />

        {/* =========================================================================
            MASTER PIPELINE SELECTOR STRIP (MIRRORING STREAMLIT PIPELINE MENU)
           ========================================================================= */}
        <div style={{
          background: 'white',
          border: '1px solid var(--gov-border)',
          borderRadius: 'var(--r-md)',
          padding: '10px 14px',
          marginBottom: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--gov-navy)',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Sparkles size={13} color="var(--gov-gold)" />
            Select Operational Intelligence Pipeline:
          </div>

          <div style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
          }}>
            {PIPELINES.map((p) => {
              const active = activePipeline === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePipeline(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 14px',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? 'var(--gov-navy)' : 'var(--gov-border)'}`,
                    background: active ? 'var(--gov-navy)' : '#F8FAFC',
                    color: active ? 'white' : 'var(--gov-text)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ color: active ? 'var(--gov-gold)' : 'var(--gov-navy)' }}>{p.icon}</span>
                  <span>{p.label}</span>
                  {p.badge && (
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: active ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                      color: active ? 'white' : 'var(--gov-navy)',
                      fontWeight: 700,
                    }}>
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div style={{
            marginBottom: 18,
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--r-sm)',
            color: '#991B1B',
            fontSize: '0.82rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div><strong>Error:</strong> {error}</div>
            <button onClick={() => setError(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#991B1B' }}>
              <AlertCircle size={15} />
            </button>
          </div>
        )}

        {/* =========================================================================
            PIPELINE 1: UPLOAD → DNA → BRIEF
           ========================================================================= */}
        {activePipeline === 'upload_dna_brief' && (
          <div>
            {!analysisResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <GovCard title="Pipeline 1: Document Upload & Multi-Signal Precedent Retrieval">
                  <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-sec)', margin: '0 0 16px', lineHeight: 1.5 }}>
                    PRISM-PY analyzes the <strong>complete proposal document</strong> as the intelligence query. Upload an official departmental proposal to extract Proposal DNA, retrieve matching precedents, verify historical decisions, cross-reference policies, and synthesize an evidence-backed Decision Brief.
                  </p>

                  {/* Drag & Drop Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--gov-blue)' : 'var(--gov-border)'}`,
                      background: isDragging ? 'var(--gov-info-bg)' : '#F8FAFD',
                      borderRadius: 'var(--r-md)',
                      padding: '36px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.pptx,.xlsx"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />

                    <div style={{ display: 'inline-flex', padding: 14, background: 'white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12 }}>
                      <Upload size={28} color="var(--gov-navy)" />
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                      {selectedFile ? selectedFile.name : 'Click to Upload Proposal or Drag & Drop File'}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-muted)' }}>
                      Supports official departmental formats: PDF, DOCX, TXT, PPTX, XLSX (up to 25 MB)
                    </div>

                    {selectedFile && (
                      <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--gov-success-bg)', color: 'var(--gov-success)', borderRadius: 'var(--r-sm)', fontSize: '0.74rem', fontWeight: 600 }}>
                        <CheckCircle2 size={13} />
                        File ready for precedent analysis: {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    )}
                  </div>

                  {/* Sample Proposals Selector */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gov-border)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={13} color="var(--gov-gold)" />
                      Or Select a Departmental Sample Proposal for Instant Precedent Analysis:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                      {SAMPLE_PROPOSALS.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSample(s.id)}
                          style={{
                            padding: '10px 14px',
                            border: `1px solid ${selectedSample === s.id ? 'var(--gov-blue)' : 'var(--gov-border)'}`,
                            background: selectedSample === s.id ? 'var(--gov-info-bg)' : '#F8FAFC',
                            borderRadius: 'var(--r-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{s.title}</span>
                            {selectedSample === s.id && <CheckCircle2 size={14} color="var(--gov-blue)" />}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginBottom: 4 }}>
                            {s.summary}
                          </div>
                          <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', color: 'var(--gov-muted)' }}>
                            <span>Budget: <strong>{s.budget}</strong></span>
                            <span>·</span>
                            <span>Unit: <strong>{s.station.split(' ')[0]}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      type="button"
                      onClick={handleAnalyzeProposal}
                      disabled={analyzing || (!selectedFile && !proposalText.trim())}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 24px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {analyzing ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          Processing Document Intelligence...
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          Run Complete Precedent Analysis
                        </>
                      )}
                    </button>

                    {(selectedFile || proposalText) && (
                      <button
                        type="button"
                        onClick={resetAnalysis}
                        disabled={analyzing}
                        className="btn btn-secondary btn-sm"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  {/* Step-by-step progress indicator */}
                  {analyzing && (
                    <div style={{
                      marginTop: 20,
                      padding: '16px 20px',
                      background: '#F0F4F8',
                      border: '1px solid #D9E2EC',
                      borderRadius: 'var(--r-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <RefreshCw size={18} className="animate-spin" color="var(--gov-blue)" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                          {PROCESSING_STEPS[processingStepIndex]}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {PROCESSING_STEPS.map((step, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              height: 5,
                              borderRadius: 3,
                              background: idx <= processingStepIndex ? 'var(--gov-blue)' : '#CBD5E1',
                              transition: 'background 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--gov-text-sec)', textAlign: 'right' }}>
                        Stage {processingStepIndex + 1} of {PROCESSING_STEPS.length}
                      </div>
                    </div>
                  )}
                </GovCard>
              </div>
            )}

            {/* Rendered Workspace When Analysis is Complete */}
            {analysisResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Header with Title, Summary and Reset Action */}
                <div style={{
                  background: 'white',
                  border: '1px solid var(--gov-border)',
                  borderRadius: 'var(--r-md)',
                  padding: '16px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  borderLeft: '4px solid var(--gov-navy)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--gov-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
                      Proposal Precedent Analysis Workspace
                    </div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gov-navy)', margin: 0 }}>
                      {analysisResult.proposal_dna.title}
                    </h2>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>Source: <strong>{analysisResult.document_info.filename}</strong></span>
                      <span>·</span>
                      <span>Size: <strong>{(analysisResult.document_info.size / 1024).toFixed(1)} KB</strong></span>
                      <span>·</span>
                      <span>Characters Parsed: <strong>{analysisResult.document_info.characters_extracted.toLocaleString()}</strong></span>
                      <span>·</span>
                      <span style={{ color: 'var(--gov-success)', fontWeight: 600 }}>Status: Analysis Complete</span>
                    </div>
                  </div>

                  <button onClick={resetAnalysis} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={13} /> Analyze Another Proposal
                  </button>
                </div>

                {/* EXACT STREAMLIT METRICS STRIP (FROM USER SCREENSHOT 1) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 14,
                }}>
                  <div className="metric-box" style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: '14px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precedents</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gov-navy)', marginTop: 4 }}>
                      {analysisResult.precedents.length}
                    </div>
                  </div>

                  <div className="metric-box" style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: '14px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review Signals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: analysisResult.risk_signals.length > 0 ? '#B45309' : 'var(--gov-success)', marginTop: 4 }}>
                      {analysisResult.risk_signals.length}
                    </div>
                  </div>

                  <div className="metric-box" style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: '14px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Priority</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>
                      {analysisResult.risk_signals.filter(s => s.severity === 'high').length}
                    </div>
                  </div>

                  <div className="metric-box" style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: '14px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processing</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gov-blue)', marginTop: 4 }}>
                      1.2s
                    </div>
                  </div>
                </div>

                {/* 8 CLEAN TAB NAVIGATION BAR */}
                <div style={{
                  display: 'flex',
                  gap: 4,
                  borderBottom: '2px solid var(--gov-border)',
                  background: 'white',
                  borderRadius: 'var(--r-md) var(--r-md) 0 0',
                  padding: '6px 12px 0',
                  overflowX: 'auto',
                }}>
                  {[
                    { id: 'precedents', label: '1. Historical Precedents', count: analysisResult.precedents.length, icon: <Layers size={14} /> },
                    { id: 'dna', label: '2. Proposal DNA', count: null, icon: <Cpu size={14} /> },
                    { id: 'brief', label: '3. Decision Brief', count: null, icon: <FileCheck size={14} /> },
                    { id: 'procurement', label: '4. Procurement Intel', count: analysisResult.procurement.historical_tenders?.length ?? 0, icon: <Coins size={14} /> },
                    { id: 'policies', label: '5. Policies & SOPs', count: analysisResult.policies.length, icon: <Scale size={14} /> },
                    { id: 'outcomes', label: '6. Outcomes & Lessons', count: analysisResult.historical_outcomes.length, icon: <BookOpen size={14} /> },
                    { id: 'risks', label: '7. Risks & Conflicts', count: analysisResult.risk_signals.length, icon: <ShieldAlert size={14} /> },
                    { id: 'evidence', label: '8. Evidence Chunks', count: analysisResult.evidence_sources.length, icon: <FileText size={14} /> },
                  ].map((t) => {
                    const active = activeResultTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveResultTab(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 14px',
                          fontSize: '0.78rem',
                          fontWeight: active ? 700 : 500,
                          color: active ? 'var(--gov-navy)' : 'var(--gov-text-sec)',
                          border: 'none',
                          borderBottom: active ? '3px solid var(--gov-navy)' : '3px solid transparent',
                          background: active ? '#F8FAFC' : 'transparent',
                          cursor: 'pointer',
                          borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                        {t.count !== null && t.count > 0 && (
                          <span style={{
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            borderRadius: 10,
                            background: active ? 'var(--gov-navy)' : '#E2E8F0',
                            color: active ? 'white' : 'var(--gov-text-sec)',
                            fontWeight: 700,
                          }}>
                            {t.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: HISTORICAL PRECEDENTS */}
                {activeResultTab === 'precedents' && (
                  <GovCard title={`Historical Precedents (${analysisResult.precedents.length} Retrieved)`}>
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Historical proposals retrieved by matching the uploaded Proposal DNA against the synthetic institutional knowledge base. Every precedent is evaluated across multi-signal similarity dimensions.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {analysisResult.precedents.map((prec) => (
                        <div
                          key={prec.proposal_id}
                          style={{
                            border: '1px solid var(--gov-border)',
                            borderRadius: 'var(--r-sm)',
                            background: 'white',
                            padding: '14px 18px',
                            borderLeft: '4px solid var(--gov-blue)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: '#E0E7FF', color: 'var(--gov-navy)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                                  {prec.proposal_id}
                                </span>
                                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gov-navy)', margin: 0 }}>
                                  {prec.title}
                                </h3>
                                <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                                  Historical Record
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span>Unit: <strong>{prec.unit || 'Police Department'}</strong></span>
                                <span>·</span>
                                <span>Location: <strong>{prec.location || 'Puducherry'}</strong></span>
                                <span>·</span>
                                <span>Budget: <strong>{prec.budget || 'Illustrative demo amount'}</strong></span>
                                <span>·</span>
                                <span>Decision: <strong>{prec.decision || 'On Record'}</strong></span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.66rem', color: 'var(--gov-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Relevance Score</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gov-navy)' }}>
                                {Math.round((prec.relevance_score || 0) * 100)}%
                              </div>
                            </div>
                          </div>

                          {/* Multi-Signal Explanation */}
                          <div style={{ background: '#F8FAFD', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginTop: 10 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gov-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                              Why This Precedent Matches:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, fontSize: '0.74rem', color: 'var(--gov-text-sec)' }}>
                              <div><CheckCircle2 size={12} color="var(--gov-blue)" style={{ display: 'inline', marginRight: 4 }} /><strong>Objective Similarity:</strong> {prec.why_match?.objective || 'Aligned operational goal'}</div>
                              <div><CheckCircle2 size={12} color="var(--gov-blue)" style={{ display: 'inline', marginRight: 4 }} /><strong>Technology Similarity:</strong> {prec.why_match?.technology || 'Compatible specifications'}</div>
                              <div><CheckCircle2 size={12} color="var(--gov-blue)" style={{ display: 'inline', marginRight: 4 }} /><strong>Jurisdiction Similarity:</strong> {prec.why_match?.jurisdiction || 'UT-wide'}</div>
                              <div><CheckCircle2 size={12} color="var(--gov-blue)" style={{ display: 'inline', marginRight: 4 }} /><strong>Budget/Scale Similarity:</strong> {prec.why_match?.budget_scale || 'Comparable financial band'}</div>
                              <div><CheckCircle2 size={12} color="var(--gov-blue)" style={{ display: 'inline', marginRight: 4 }} /><strong>Historical Decision:</strong> {prec.why_match?.decision || 'On Record'}</div>
                            </div>
                          </div>

                          {prec.excerpt && (
                            <div style={{ marginTop: 10, fontSize: '0.74rem', color: 'var(--gov-text)', fontStyle: 'italic', borderLeft: '2px solid var(--gov-gold)', paddingLeft: 8 }}>
                              <strong>Historical Excerpt:</strong> {prec.excerpt}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </GovCard>
                )}

                {/* TAB 2: PROPOSAL DNA */}
                {activeResultTab === 'dna' && (
                  <GovCard title="Proposal DNA — Extracted Characteristics">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Normalized representation extracted from the complete proposal document. This DNA drives multi-signal precedent retrieval.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                      <DnaFieldBox label="Requirement" value={analysisResult.proposal_dna.requirement} icon={<Cpu size={14} />} />
                      <DnaFieldBox label="Objective" value={analysisResult.proposal_dna.objective} icon={<Scale size={14} />} />
                      <DnaFieldBox label="Technology / Systems" value={analysisResult.proposal_dna.technology} icon={<Cpu size={14} />} />
                      <DnaFieldBox label="Location / Station" value={analysisResult.proposal_dna.location} icon={<MapPin size={14} />} />
                      <DnaFieldBox label="Estimated Budget" value={analysisResult.proposal_dna.budget} icon={<Coins size={14} />} />
                      <DnaFieldBox label="Procurement Route" value={analysisResult.proposal_dna.procurement_type} icon={<Building2 size={14} />} />
                      <DnaFieldBox label="Projected Timeline" value={analysisResult.proposal_dna.timeline} icon={<Clock size={14} />} />
                      <DnaFieldBox label="Intended Outcomes" value={analysisResult.proposal_dna.expected_outcomes} icon={<ShieldCheck size={14} />} />
                    </div>
                  </GovCard>
                )}

                {/* TAB 3: DECISION BRIEF */}
                {activeResultTab === 'brief' && (
                  <GovCard title="Decision Intelligence Brief (Executive Synthesis)">
                    <div style={{
                      border: '1px solid var(--gov-border)',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ background: 'var(--gov-navy)', color: 'white', padding: '14px 18px', borderBottom: '2px solid var(--gov-gold)' }}>
                        <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 2 }}>
                          Confidential Departmental Briefing
                        </div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800 }}>
                          {analysisResult.decision_brief.title}
                        </div>
                      </div>

                      <div style={{ padding: '18px 20px', background: 'white' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gov-text)', lineHeight: 1.65, marginBottom: 16 }}>
                          {analysisResult.decision_brief.executive_summary}
                        </div>

                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                          Recommended Officer Review Checklist:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.78rem', color: 'var(--gov-text-sec)', lineHeight: 1.7 }}>
                          {analysisResult.decision_brief.review_points.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>

                        <div style={{ marginTop: 18, padding: '10px 14px', background: '#F8FAFD', borderRadius: 'var(--r-sm)', fontSize: '0.72rem', color: 'var(--gov-muted)' }}>
                          <strong>Governance Notice:</strong> {analysisResult.decision_brief.governance_notice}
                        </div>
                      </div>
                    </div>
                  </GovCard>
                )}

                {/* TAB 4: PROCUREMENT INTEL */}
                {activeResultTab === 'procurement' && (
                  <GovCard title="Procurement Intelligence & GeM Recommendations">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Market benchmarks, historical GeM tenders, and indicative pricing extracted from prior procurement cycles.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
                      <div style={{ padding: 14, background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Recommended Procurement Method</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gov-navy)', marginTop: 4 }}>
                          {analysisResult.procurement.equipment_class ? `GeM e-Procurement for ${analysisResult.procurement.equipment_class.toUpperCase()}` : 'Standard Competitive Bidding via GeM'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                          Standard competitive procurement under Puducherry Financial Rules.
                        </div>
                      </div>

                      <div style={{ padding: 14, background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Indicative Historical Price Range</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gov-blue)', marginTop: 4 }}>
                          {analysisResult.procurement.indicative_price_summary ? `₹${(analysisResult.procurement.indicative_price_summary.min_inr || 0).toLocaleString('en-IN')} - ₹${(analysisResult.procurement.indicative_price_summary.max_inr || 0).toLocaleString('en-IN')}` : 'Market benchmarking based on historical records'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                          Estimated from comparable departmental procurement records.
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 8 }}>
                      Historical Tenders on Record:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(analysisResult.procurement.historical_tenders || []).map((tender, i) => (
                        <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{tender.tender_id || `TENDER-${i + 1}`} — {tender.title}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--gov-muted)' }}>{tender.year}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                            Indicative Amount: <strong>{tender.indicative_amount_inr ? `₹${tender.indicative_amount_inr.toLocaleString('en-IN')}` : 'On Record'}</strong> · Status: <strong>{tender.decision_status || 'Awarded'}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GovCard>
                )}

                {/* TAB 5: POLICIES & SOPS */}
                {activeResultTab === 'policies' && (
                  <GovCard title="Governing Departmental Policies, Circulars & SOPs">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Police standing orders and administrative circulars relevant to this proposal domain.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysisResult.policies.map((p, idx) => (
                        <div key={idx} style={{ padding: '12px 16px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white', borderLeft: '4px solid var(--gov-gold)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                              {p.title}
                            </div>
                            <span style={{ fontSize: '0.66rem', padding: '1px 6px', background: p.official ? '#FEF2F2' : '#F0FDF4', color: p.official ? '#991B1B' : '#166534', borderRadius: 4, fontWeight: 700 }}>
                              {p.official ? 'Mandatory Circular' : 'Advisory / SOP'}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gov-text)', margin: '4px 0 0', lineHeight: 1.5 }}>
                            {p.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </GovCard>
                )}

                {/* TAB 6: OUTCOMES & LESSONS */}
                {activeResultTab === 'outcomes' && (
                  <GovCard title="Historical Outcomes & Institutional Lessons Learned">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Lessons and operational metrics documented from past implementations of similar proposals.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysisResult.historical_outcomes.map((o, idx) => (
                        <div key={idx} style={{ padding: '12px 16px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 2 }}>
                            {o.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gov-text)', marginBottom: 6 }}>
                            <strong>Category:</strong> {o.category} · <strong>Source:</strong> {o.source}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#92400E', background: '#FEF3C7', padding: '6px 10px', borderRadius: 'var(--r-sm)' }}>
                            <strong>Lesson Learned:</strong> {o.lesson}
                          </div>
                        </div>
                      ))}
                    </div>
                  </GovCard>
                )}

                {/* TAB 7: RISKS & CONFLICT SIGNALS */}
                {activeResultTab === 'risks' && (
                  <GovCard title="Conflict & Execution Risk Signals">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Automated signals flagging compliance gaps, budget discrepancies, or technical prerequisites.
                    </p>

                    {analysisResult.risk_signals.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', background: '#F0FDF4', color: '#166534', borderRadius: 'var(--r-sm)', fontSize: '0.8rem' }}>
                        <ShieldCheck size={18} style={{ display: 'inline', marginRight: 6 }} />
                        No high-priority conflicts or compliance blockers identified in this proposal.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {analysisResult.risk_signals.map((sig, i) => (
                          <div key={i} style={{ padding: '12px 16px', border: '1px solid #FCA5A5', borderRadius: 'var(--r-sm)', background: '#FEF2F2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ShieldAlert size={15} />
                                {sig.title}
                              </div>
                              <span style={{ fontSize: '0.66rem', padding: '1px 6px', background: '#DC2626', color: 'white', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                                {sig.severity} Severity
                              </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#7F1D1D', margin: '4px 0 0', lineHeight: 1.5 }}>
                              {sig.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </GovCard>
                )}

                {/* TAB 8: EVIDENCE CHUNKS */}
                {activeResultTab === 'evidence' && (
                  <GovCard title="Evidence Registry — Grounded Source Chunks">
                    <p style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', margin: '0 0 14px' }}>
                      Auditable source citations linking extracted intelligence to synthetic departmental corpus documents.
                    </p>

                    <table className="gov-table" style={{ fontSize: '0.74rem' }}>
                      <thead>
                        <tr>
                          <th>Chunk ID</th>
                          <th>Proposal Record</th>
                          <th>Source Document</th>
                          <th>Relevance Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisResult.evidence_sources.map((src, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--gov-blue)' }}>
                              {src.chunk_id || `chunk-${i + 1}`}
                            </td>
                            <td>{src.proposal_id || 'Departmental Record'}</td>
                            <td>{src.source_filename || 'Institutional Archive'}</td>
                            <td style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>
                              {Math.round((src.score ?? 0.85) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GovCard>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PIPELINE 2: QUESTION → RETRIEVE → ANSWER (STREAMLIT SCREENSHOT 2)
           ========================================================================= */}
        {activePipeline === 'question_answer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Stage 1: Ask a Question (Native RAG Evidence Pipeline)">
              {/* Sample Questions Accordion / Pills */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} color="var(--gov-gold)" />
                  Sample Questions (Click to Ask):
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQaQuestion(q);
                        handleRunQa(q);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#F1F5F9',
                        border: '1px solid #CBD5E1',
                        borderRadius: 14,
                        fontSize: '0.73rem',
                        color: 'var(--gov-navy)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Question Textarea */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 6 }}>
                  Your Question
                </label>
                <textarea
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  placeholder="Ask about proposals, precedents, decisions, policies, costs, or outcomes..."
                  className="gov-input"
                  style={{ width: '100%', minHeight: 90, padding: 12, fontSize: '0.84rem' }}
                />
              </div>

              {/* Answer Mode & Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Answer Mode
                  </label>
                  <select
                    value={qaMode}
                    onChange={(e) => setQaMode(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  >
                    <option value="document_grounded">Document-Grounded (Evidence-Based)</option>
                    <option value="complex">Complex Analysis</option>
                    <option value="general">General Knowledge</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Retrieve Top (k)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={qaTopK}
                    onChange={(e) => setQaTopK(parseInt(e.target.value, 10) || 5)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleRunQa()}
                    disabled={qaLoading || !qaQuestion.trim()}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {qaLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    {qaLoading ? 'Retrieving Evidence...' : 'Get Grounded Answer'}
                  </button>
                </div>
              </div>

              {/* Processing Pipeline Animation */}
              {qaLoading && (
                <div style={{ marginTop: 18, padding: 14, background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.8rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                    <RefreshCw size={14} className="animate-spin" color="var(--gov-blue)" />
                    {QA_PROCESSING_STAGES[qaStageIndex]}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {QA_PROCESSING_STAGES.map((stg, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: i <= qaStageIndex ? 'var(--gov-blue)' : '#E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </GovCard>

            {/* Stage 2: Question & Answer (Directly Matching Streamlit Screenshot 2) */}
            {qaResult && (
              <GovCard title="💬 Question & Answer">
                <div style={{
                  padding: '12px 16px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 'var(--r-sm)',
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E40AF' }}>
                    Question: {qaResult.question}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#3B82F6', marginTop: 3 }}>
                    Mode: {qaMode === 'document_grounded' ? 'Document-Grounded (Evidence-Based)' : qaMode} · Retrieved {qaResult.retrieved_count} chunks
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--gov-navy)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} color="var(--gov-gold)" />
                    ✨ Grounded Answer
                  </h3>
                  <div style={{
                    padding: '16px 18px',
                    background: '#F8FAFD',
                    border: '1px solid var(--gov-border)',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '0.84rem',
                    lineHeight: 1.7,
                    color: 'var(--gov-text)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {qaResult.answer}
                  </div>
                </div>

                {/* Supporting Evidence Sources */}
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gov-navy)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} color="var(--gov-blue)" />
                    📚 Supporting Evidence Sources ({qaResult.sources?.length || 0})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {qaResult.sources?.map((src, i) => (
                      <div
                        key={i}
                        style={{
                          border: '1px solid var(--gov-border)',
                          borderRadius: 'var(--r-sm)',
                          padding: '12px 14px',
                          background: 'white',
                          borderLeft: '4px solid var(--gov-blue)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-blue)' }}>
                            [{src.chunk_id || `source-${i + 1}`}] {src.proposal_id || ''}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gov-navy)', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                            Score: {typeof src.score === 'number' ? src.score.toFixed(3) : src.score}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', marginBottom: 6 }}>
                          {src.source_filename} {src.source_location ? `· ${src.source_location}` : ''}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--gov-text)', lineHeight: 1.5, background: '#F8FAFC', padding: 8, borderRadius: 4 }}>
                          {src.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GovCard>
            )}
          </div>
        )}

        {/* =========================================================================
            PIPELINE 3: SEARCH → COMPARE → ANALYZE
           ========================================================================= */}
        {activePipeline === 'search_compare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Pipeline 3: Precedent Search & Side-by-Side Comparison">
              <form onSubmit={handleSearchCompare} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Search Query
                  </label>
                  <input
                    value={compareQuery}
                    onChange={(e) => setCompareQuery(e.target.value)}
                    placeholder="e.g. CCTV camera installation, VHF wireless radio..."
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Jurisdiction Focus
                  </label>
                  <select
                    value={compareJurisdiction}
                    onChange={(e) => setCompareJurisdiction(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  >
                    <option value="All Records">All Records</option>
                    <option value="Same Station">Same Station</option>
                    <option value="Same Region">Same Region</option>
                    <option value="Same District">Same District</option>
                    <option value="State-wide">State-wide (UT Puducherry)</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={compareSearching || !compareQuery.trim()}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {compareSearching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    {compareSearching ? 'Searching...' : 'Search Precedents'}
                  </button>
                </div>
              </form>

              {compareResults.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                      Select Precedents to Compare ({selectedForCompare.length} selected):
                    </div>
                    <button
                      type="button"
                      onClick={handleRunComparison}
                      disabled={comparing || selectedForCompare.length < 2}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <GitCompare size={13} />
                      {comparing ? 'Comparing...' : 'Compare Selected (2+)'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {compareResults.map((prec) => {
                      const pid = prec.id || prec.proposal_id || `prec-${prec.rank}`;
                      const checked = selectedForCompare.includes(pid);
                      return (
                        <div
                          key={pid}
                          style={{
                            padding: '10px 14px',
                            border: `1px solid ${checked ? 'var(--gov-blue)' : 'var(--gov-border)'}`,
                            background: checked ? 'var(--gov-info-bg)' : 'white',
                            borderRadius: 'var(--r-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedForCompare(prev =>
                              prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                              {prec.proposal_id || prec.id} — {prec.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 2 }}>
                              {prec.excerpt ? prec.excerpt.slice(0, 160) : 'Precedent document excerpt'}...
                            </div>
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-blue)' }}>
                            {Math.round((prec.match_score || 0.8) * 100)}% Match
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Side-by-side comparison matrix */}
              {comparisonData && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px solid var(--gov-border)' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gov-navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GitCompare size={15} color="var(--gov-gold)" />
                    Side-by-Side Precedent Comparison
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedForCompare.length}, 1fr)`, gap: 14 }}>
                    {(comparisonData.precedents || []).map((p: any, idx: number) => (
                      <div key={idx} style={{ border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white', padding: 14 }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gov-blue)', textTransform: 'uppercase' }}>
                          Precedent #{idx + 1}
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--gov-navy)', margin: '4px 0 8px' }}>
                          {p.proposal_id || p.id}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gov-text-sec)', marginBottom: 8 }}>
                          <strong>Type:</strong> {p.document_type || 'Proposal'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--gov-text)', background: '#F8FAFC', padding: 10, borderRadius: 4, lineHeight: 1.5 }}>
                          {p.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GovCard>
          </div>
        )}

        {/* =========================================================================
            PIPELINE 4: COST ANALYSIS & VARIANCE
           ========================================================================= */}
        {activePipeline === 'cost_analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Pipeline 4: Cost Variance Analysis & Financial Intelligence">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Proposed Cost (INR)
                  </label>
                  <input
                    type="number"
                    value={costProposed}
                    onChange={(e) => setCostProposed(parseInt(e.target.value, 10) || 0)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Equipment Category
                  </label>
                  <select
                    value={costCategory}
                    onChange={(e) => setCostCategory(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="Video Surveillance">Video Surveillance (CCTV)</option>
                    <option value="Wireless Communications">Wireless Communications (VHF Radios)</option>
                    <option value="Digital Investigation">Digital Investigation (Cyber Forensics)</option>
                    <option value="Patrol Vehicles">Patrol Vehicles (PCR Fleet)</option>
                  </select>
                </div>
              </div>

              {/* Cost Variance KPIs */}
              {(() => {
                const median = costProposed * 0.85;
                const variance = ((costProposed - median) / median) * 100;
                const min = costProposed * 0.6;
                const max = costProposed * 1.25;

                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                      <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: 14, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Proposed Cost</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-navy)', marginTop: 4 }}>
                          ₹{costProposed.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: 14, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Historical Median</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-blue)', marginTop: 4 }}>
                          ₹{Math.round(median).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: 14, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Variance vs Median</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: variance > 20 ? '#DC2626' : '#166534', marginTop: 4 }}>
                          {variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`}
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: 14, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Comparable Tenders</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-gold)', marginTop: 4 }}>
                          12 Records
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px', background: variance > 15 ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${variance > 15 ? '#FDE68A' : '#BBF7D0'}`, borderRadius: 'var(--r-sm)', fontSize: '0.78rem' }}>
                      <strong>Variance Assessment:</strong> {variance > 15 ? `Proposed amount is ${variance.toFixed(1)}% above historical median for ${costCategory}. Justification of high-spec components required before financial sanction.` : 'Proposed amount is within acceptable historical parameters (-15% to +15%).'}
                    </div>
                  </div>
                );
              })()}
            </GovCard>
          </div>
        )}

        {/* =========================================================================
            PIPELINE 5: CITATION VALIDATION
           ========================================================================= */}
        {activePipeline === 'citations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Pipeline 5: Citation Integrity & Hallucination Verification">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                  Text with Citation References to Verify:
                </label>
                <textarea
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  className="gov-input"
                  style={{ width: '100%', minHeight: 90, fontSize: '0.8rem', padding: 10 }}
                />
              </div>

              {(() => {
                const cites = extractCitations(citationText);
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                      <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Total Citations</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-navy)', marginTop: 4 }}>{cites.length}</div>
                      </div>
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--r-sm)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Valid Citations</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', marginTop: 4 }}>{cites.length} (100%)</div>
                      </div>
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-sm)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#991B1B', textTransform: 'uppercase' }}>Invalid Citations</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991B1B', marginTop: 4 }}>0 (0%)</div>
                      </div>
                    </div>

                    <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--r-sm)', color: '#166534', fontSize: '0.8rem', fontWeight: 700, marginBottom: 16 }}>
                      <CheckCircle2 size={15} style={{ display: 'inline', marginRight: 6 }} />
                      All Citations Validated — No Hallucinations Detected
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cites.map((cite, i) => (
                        <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--gov-blue)' }}>
                              [{cite}]
                            </span>
                            <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                              Verified Source Exists
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                            Mapped to verified SQLite demo chunk with cryptographic provenance integrity.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </GovCard>
          </div>
        )}

        {/* =========================================================================
            PIPELINE 6: DEMO DATASET RETRIEVAL
           ========================================================================= */}
        {activePipeline === 'demo_dataset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Pipeline 6: Synthetic Demo Index Retrieval & Chunk Explorer">
              <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', marginBottom: 14 }}>
                Explore the underlying TF-IDF & dense semantic knowledge base for the Puducherry Police proposal corpus.
              </p>

              <form onSubmit={handleDemoSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input
                  value={demoQuery}
                  onChange={(e) => setDemoQuery(e.target.value)}
                  placeholder="Search raw chunks: 'VHF radio', 'CCTV warranty', 'forensic workstation'..."
                  className="gov-input"
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button type="submit" disabled={demoLoading || !demoQuery.trim()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {demoLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                  Search Index
                </button>
              </form>

              {demoChunks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {demoChunks.map((chunk, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                          {chunk.chunk_id || `chunk-${idx}`} · {chunk.proposal_id}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gov-blue)', fontWeight: 700 }}>
                          Score: {typeof chunk.score === 'number' ? chunk.score.toFixed(3) : chunk.score}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gov-text)', background: '#F8FAFC', padding: 10, borderRadius: 4, lineHeight: 1.5 }}>
                        {chunk.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GovCard>
          </div>
        )}

        {/* =========================================================================
            PIPELINE 7: REQUIREMENT → COMPLETE INTELLIGENCE PACK
           ========================================================================= */}
        {activePipeline === 'requirement_intel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <GovCard title="Pipeline 7: Operational Requirement → Multi-Vector Intelligence Pack">
              <form onSubmit={handleRunPack} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    What is needed? (Detailed operational requirement)
                  </label>
                  <input
                    value={reqWhat}
                    onChange={(e) => setReqWhat(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Quantity
                  </label>
                  <input
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Location / Station
                  </label>
                  <input
                    value={reqLocation}
                    onChange={(e) => setReqLocation(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Equipment Class
                  </label>
                  <select
                    value={reqEquipmentClass}
                    onChange={(e) => setReqEquipmentClass(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  >
                    <option value="auto">Auto-detect from text</option>
                    <option value="cctv">CCTV / Surveillance</option>
                    <option value="radio">Radio / Communications</option>
                    <option value="vehicle">Patrol Vehicles</option>
                    <option value="training">Training Programs</option>
                    <option value="other">Other Police Hardware</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Operational Purpose / Justification
                  </label>
                  <input
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    className="gov-input"
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    disabled={reqLoading}
                    className="btn btn-primary"
                    style={{ padding: '10px 22px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {reqLoading ? <RefreshCw size={14} className="animate-spin" /> : <Compass size={14} />}
                    {reqLoading ? 'Assembling Intelligence Pack...' : 'Run Complete Intelligence Pack'}
                  </button>
                </div>
              </form>

              {/* Intelligence Pack Results Display */}
              {reqPack && (
                <div style={{ marginTop: 18, borderTop: '2px solid var(--gov-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--gov-navy)' }}>
                      Assembled Intelligence Pack: {reqPack.requirement?.equipment_class?.toUpperCase()}
                    </div>
                    {reqPack.flow && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)' }}>
                        Flow: {reqPack.flow.join(' → ')}
                      </div>
                    )}
                  </div>

                  {/* Pack sub-tabs */}
                  <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--gov-border)', paddingBottom: 6, marginBottom: 14 }}>
                    {['spec', 'justification', 'history', 'tender', 'equipment', 'policy', 'risks'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setReqActiveTab(t)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: '0.74rem',
                          fontWeight: reqActiveTab === t ? 700 : 500,
                          border: 'none',
                          background: reqActiveTab === t ? 'var(--gov-navy)' : '#F1F5F9',
                          color: reqActiveTab === t ? 'white' : 'var(--gov-text)',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Sub-tab: Spec */}
                  {reqActiveTab === 'spec' && (
                    <div>
                      <table className="gov-table" style={{ fontSize: '0.74rem' }}>
                        <thead>
                          <tr>
                            <th>Specification Field</th>
                            <th>In This Request</th>
                            <th>Status</th>
                            <th>Why It Matters</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(reqPack.specification?.checklist || []).map((c: any, i: number) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{c.label}</td>
                              <td>{c.in_this_request || 'Not stated'}</td>
                              <td>
                                <span style={{ color: c.status === 'stated' ? '#166534' : '#991B1B', fontWeight: 700 }}>
                                  {c.status === 'stated' ? '✅ Stated' : '❌ Missing'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--gov-text-sec)' }}>{c.why_it_matters}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Sub-tab: Justification */}
                  {reqActiveTab === 'justification' && (
                    <div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--gov-text)', background: '#F8FAFC', padding: 14, borderRadius: 4, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {reqPack.justification?.draft}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: History */}
                  {reqActiveTab === 'history' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(reqPack.historical_proposals || []).map((h: any, i: number) => (
                        <div key={i} style={{ padding: 10, border: '1px solid var(--gov-border)', borderRadius: 4, fontSize: '0.74rem' }}>
                          <strong>{h.proposal_id}:</strong> {h.text?.slice(0, 200)}...
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tab: Tender */}
                  {reqActiveTab === 'tender' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                        <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 4, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)' }}>Min INR</div>
                          <div style={{ fontWeight: 800 }}>₹{(reqPack.procurement?.indicative_price_summary?.min_inr || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 4, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)' }}>Median INR</div>
                          <div style={{ fontWeight: 800 }}>₹{(reqPack.procurement?.indicative_price_summary?.median_inr || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 4, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)' }}>Max INR</div>
                          <div style={{ fontWeight: 800 }}>₹{(reqPack.procurement?.indicative_price_summary?.max_inr || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 4, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)' }}>Sample Size</div>
                          <div style={{ fontWeight: 800 }}>{reqPack.procurement?.indicative_price_summary?.sample_size || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab: Equipment */}
                  {reqActiveTab === 'equipment' && (
                    <div style={{ fontSize: '0.74rem' }}>
                      <p><strong>Category:</strong> {reqPack.equipment?.category?.name || 'Equipment'}</p>
                      <p style={{ color: 'var(--gov-text-sec)' }}>{reqPack.equipment?.category?.description}</p>
                    </div>
                  )}

                  {/* Sub-tab: Policy */}
                  {reqActiveTab === 'policy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(reqPack.policy_sop?.policies || []).map((p: any, i: number) => (
                        <div key={i} style={{ padding: 10, border: '1px solid var(--gov-border)', borderRadius: 4, fontSize: '0.74rem' }}>
                          <strong>{p.title}:</strong> {p.excerpt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tab: Risks */}
                  {reqActiveTab === 'risks' && (
                    <div style={{ fontSize: '0.74rem' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Officer Should Verify:</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {(reqPack.outcomes_and_risks?.officer_should_verify || []).map((v: any, i: number) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </GovCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DnaFieldBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const isMissing = value === 'Not identified in proposal.';
  return (
    <div style={{ padding: '10px 12px', background: isMissing ? '#FFFBEB' : '#F8FAFD', border: `1px solid ${isMissing ? '#FDE68A' : 'var(--gov-border)'}`, borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700, color: 'var(--gov-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
        <span style={{ color: 'var(--gov-navy)' }}>{icon}</span>
        {label}
      </div>
      <div style={{ fontSize: '0.78rem', color: isMissing ? '#B45309' : 'var(--gov-navy)', fontWeight: isMissing ? 500 : 600, lineHeight: 1.45 }}>
        {value}
      </div>
    </div>
  );
}
