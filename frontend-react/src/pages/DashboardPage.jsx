import { useState, useEffect } from 'react';
import { 
  listJobs, 
  listCandidates, 
  updateCandidateStage, 
  candidateHistory, 
  createJob, 
  publishJob, 
  pauseJob, 
  deleteJob,
  downloadResume, 
  uploadResumesToJob 
} from '../services/api';
import { 
  Layers, 
  Briefcase, 
  Users, 
  Award, 
  ShieldCheck, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  Sparkles, 
  LogOut,
  FileText,
  AlertCircle,
  ArrowRight,
  Pause,
  Play,
  Ban,
  Trash2,
  Sliders,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  UploadCloud
} from 'lucide-react';

const JOB_TEMPLATES = {
  "Frontend Engineer": {
    title: "Frontend Software Engineer",
    skills: "React, JavaScript, CSS, HTML, TypeScript, Tailwind",
    description: "We are looking for an experienced Frontend Engineer to build responsive, high-performance web applications. Must have strong experience with React ecosystem and modern CSS frameworks."
  },
  "Backend Java Developer": {
    title: "Backend Java Developer",
    skills: "Java, Spring Boot, SQL, Microservices, REST APIs, Git",
    description: "Seeking a strong Backend Developer to design and implement scalable microservices using Java and Spring Boot. Experience with relational databases and API design is required."
  },
  "Data Scientist": {
    title: "Data Scientist (Machine Learning)",
    skills: "Python, Machine Learning, SQL, Pandas, Scikit-Learn, NLP",
    description: "Looking for a Data Scientist to build predictive models and NLP pipelines. Must be proficient in Python and common data science libraries, with a solid foundation in statistics."
  },
  "DevOps Engineer": {
    title: "Cloud DevOps Engineer",
    skills: "AWS, Docker, Kubernetes, Linux, CI/CD, Terraform",
    description: "Seeking a DevOps engineer to automate our deployment pipelines and manage cloud infrastructure on AWS. Strong experience with containerization and Infrastructure as Code is needed."
  }
};

const STAGE_PRESET_REASONS = {
  INTERVIEW: [
    "Strong technical foundation & relevant stack experience",
    "Exceeds required seniority and problem-solving background",
    "Impressive project portfolio and domain expertise"
  ],
  REJECTED: [
    "Missing core framework and required technical competencies",
    "Years of experience fall below minimum role requirements",
    "Qualifications profile does not align with current requisition"
  ],
  OFFER: [
    "Outstanding interview and technical evaluation performance",
    "Strong problem-solving capability and team culture fit"
  ]
};

const parseCandidateExplanation = (rawExplanation) => {
  if (!rawExplanation) {
    return {
      explanation: 'Analysis pending or manual evaluation required.',
      strengths: [],
      skill_gaps: [],
      top_matching_terms: [],
      skills_required_score: null,
      skills_preferred_score: null,
      experience_score: null,
      education_score: null,
      global_context_score: null
    };
  }
  if (typeof rawExplanation === 'string' && rawExplanation.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawExplanation);
      return {
        explanation: parsed.explanation || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        skill_gaps: Array.isArray(parsed.skill_gaps) ? parsed.skill_gaps : [],
        top_matching_terms: Array.isArray(parsed.top_matching_terms) ? parsed.top_matching_terms : [],
        skills_required_score: parsed.skills_required_score ?? null,
        skills_preferred_score: parsed.skills_preferred_score ?? null,
        experience_score: parsed.experience_score ?? null,
        education_score: parsed.education_score ?? null,
        global_context_score: parsed.global_context_score ?? null
      };
    } catch {
      // ignore parse error, use raw string
    }
  }
  return {
    explanation: String(rawExplanation),
    strengths: [],
    skill_gaps: [],
    top_matching_terms: [],
    skills_required_score: null,
    skills_preferred_score: null,
    experience_score: null,
    education_score: null,
    global_context_score: null
  };
};

const DEFAULT_SIMULATOR_WEIGHTS = { skills: 40, experience: 25, education: 15, preferred: 10, context: 10 };

const computeCandidateScores = (candidate, weights, isSimulatorActive) => {
  const rawExplanation = candidate.matchExplanation || candidate.recruiter_explanation || candidate.aiFeedback;
  const parsed = parseCandidateExplanation(rawExplanation);
  const baselineScore = candidate.matchScore != null ? candidate.matchScore : 0;
  
  if (!isSimulatorActive) {
    return {
      score: baselineScore,
      isSimulated: false,
      parsed
    };
  }

  const req = parsed.skills_required_score ?? baselineScore;
  const pref = parsed.skills_preferred_score ?? (req * 0.85);
  const exp = parsed.experience_score ?? baselineScore;
  const edu = parsed.education_score ?? 0.8;
  const ctx = parsed.global_context_score ?? baselineScore;

  const totalW = (weights.skills || 0) + (weights.experience || 0) + (weights.education || 0) + (weights.preferred || 0) + (weights.context || 0);
  if (totalW === 0) {
    return {
      score: baselineScore,
      isSimulated: true,
      parsed
    };
  }

  const rawSimulated = (
    ((weights.skills || 0) * req) +
    ((weights.experience || 0) * exp) +
    ((weights.education || 0) * edu) +
    ((weights.preferred || 0) * pref) +
    ((weights.context || 0) * ctx)
  ) / totalW;

  return {
    score: Math.min(1, Math.max(0, Math.round(rawSimulated * 1000) / 1000)),
    isSimulated: true,
    parsed
  };
};

export default function DashboardPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState('ALL');
  const [allCandidates, setAllCandidates] = useState([]);
  const [jobCounts, setJobCounts] = useState({});
  const [savedCandidates, setSavedCandidates] = useState([]);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Distinct Feature Tabs: 'CREATE' (Requisition Authoring) vs 'BATCH_UPLOAD' (Standalone Batch Resume Ingestion)
  const [leftFeatureTab, setLeftFeatureTab] = useState('CREATE');
  const [batchJobId, setBatchJobId] = useState('');
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchDragActive, setBatchDragActive] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // What-If Weight Simulator State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [simWeights, setSimWeights] = useState(DEFAULT_SIMULATOR_WEIGHTS);

  const handleWeightChange = (key, val) => {
    setSimWeights(prev => ({ ...prev, [key]: val }));
  };

  const handleResetSimulator = () => {
    setSimWeights({ ...DEFAULT_SIMULATOR_WEIGHTS });
    setSimulatorActive(false);
  };

  // Custom Stage Decision Modal State (replaces native window.prompt)
  const [stageModal, setStageModal] = useState({
    isOpen: false,
    stage: '',
    candidate: null,
    reason: '',
    isSubmitting: false,
    validationError: ''
  });

  const refreshPipeline = async (targetJob = activeJob) => {
    try {
      const loadedJobs = await listJobs();
      setJobs(loadedJobs || []);

      const candidatesByJob = await Promise.all(
        (loadedJobs || []).map(async (j) => {
          try {
            const list = await listCandidates(j.id);
            return list.map(c => ({ ...c, jobTitle: j.title, jobId: j.id }));
          } catch {
            return [];
          }
        })
      );

      const combined = candidatesByJob.flat();
      setAllCandidates(combined);

      const counts = {};
      (loadedJobs || []).forEach((j, index) => {
        counts[j.id] = candidatesByJob[index]?.length || 0;
      });
      setJobCounts(counts);

      if (targetJob === 'ALL') {
        setSavedCandidates(combined);
      } else {
        const numId = Number(targetJob);
        setSavedCandidates(combined.filter(c => Number(c.jobId) === numId));
      }
      setErrorMessage('');
    } catch {
      setErrorMessage('Could not load recruitment pipeline.');
    }
  };

  useEffect(() => {
    refreshPipeline('ALL');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJobSelect = (value) => {
    setActiveJob(value);
    if (value === 'ALL') {
      setSavedCandidates(allCandidates);
    } else {
      const numId = Number(value);
      setSavedCandidates(allCandidates.filter(c => Number(c.jobId) === numId));
    }
  };

  const reviewCandidate = async (candidate) => {
    const rawExplanation = candidate.matchExplanation || candidate.recruiter_explanation || candidate.aiFeedback;
    const parsed = candidate.parsedData || parseCandidateExplanation(rawExplanation);
    const candidateId = candidate.candidateId || candidate.id;
    const enrichedCandidate = {
      ...candidate,
      candidateId,
      filename: candidate.filename || candidate.name,
      final_score: candidate.computedScore ?? candidate.final_score ?? candidate.matchScore ?? candidate.aiScore ?? 0,
      baselineScore: candidate.matchScore ?? candidate.aiScore ?? 0,
      isSimulated: Boolean(candidate.isSimulated),
      simulatedRank: candidate.simulatedRank,
      rankShift: candidate.rankShift,
      recruiter_explanation: parsed.explanation || candidate.recruiter_explanation || '',
      strengths: (candidate.strengths && candidate.strengths.length > 0) ? candidate.strengths : parsed.strengths,
      skill_gaps: (candidate.skill_gaps && candidate.skill_gaps.length > 0) ? candidate.skill_gaps : parsed.skill_gaps,
      top_matching_terms: (candidate.top_matching_terms && candidate.top_matching_terms.length > 0) ? candidate.top_matching_terms : parsed.top_matching_terms,
      skills_required_score: parsed.skills_required_score ?? candidate.skills_required_score ?? null,
      skills_preferred_score: parsed.skills_preferred_score ?? candidate.skills_preferred_score ?? null,
      experience_score: parsed.experience_score ?? candidate.experience_score ?? null,
      education_score: parsed.education_score ?? candidate.education_score ?? null,
      global_context_score: parsed.global_context_score ?? candidate.global_context_score ?? null,
      jobTitle: candidate.jobTitle,
      jobId: candidate.jobId,
      email: candidate.email
    };
    setSelectedCandidate(enrichedCandidate);
    if (candidateId) {
      try {
        const hist = await candidateHistory(candidateId);
        setHistory(hist);
      } catch {
        setHistory([]);
      }
    }
  };

  const openDecisionModal = (stage, candidate = selectedCandidate) => {
    setStageModal({
      isOpen: true,
      stage,
      candidate,
      reason: STAGE_PRESET_REASONS[stage]?.[0] || '',
      isSubmitting: false,
      validationError: ''
    });
  };

  const handleConfirmDecision = async () => {
    if (!stageModal.reason.trim()) {
      setStageModal(prev => ({ ...prev, validationError: 'Please provide a clear justification reason.' }));
      return;
    }

    setStageModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const candidateId = stageModal.candidate.candidateId || stageModal.candidate.id;
      await updateCandidateStage(candidateId, stageModal.stage, stageModal.reason.trim());
      await refreshPipeline(activeJob);
      
      // Refresh modal history if current candidate is open
      if (selectedCandidate) {
        try {
          const updatedHist = await candidateHistory(candidateId);
          setHistory(updatedHist);
          setSelectedCandidate(prev => ({ ...prev, stage: stageModal.stage }));
        } catch {
          setSelectedCandidate(null);
        }
      }

      setStageModal({ isOpen: false, stage: '', candidate: null, reason: '', isSubmitting: false, validationError: '' });
      setSuccessMessage(`Candidate moved to ${stageModal.stage}. Event permanently logged.`);
      setErrorMessage('');
    } catch {
      setStageModal(prev => ({ ...prev, isSubmitting: false, validationError: 'Could not record the review decision. Please try again.' }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const applyTemplate = (templateName) => {
    setSelectedTemplate(templateName);
    if (templateName === 'custom') {
      setJobTitle('');
      setRequiredSkills('');
      setJobDescription('');
    } else {
      const tpl = JOB_TEMPLATES[templateName];
      if (tpl) {
        setJobTitle(tpl.title);
        setRequiredSkills(tpl.skills);
        setJobDescription(tpl.description);
      }
    }
  };

  const handleTemplateChange = (e) => {
    applyTemplate(e.target.value);
  };

  const saveDraft = async () => {
    if (!jobTitle.trim() || !jobDescription.trim() || !requiredSkills.trim()) {
      setErrorMessage('Please add a job title, description, and required skills first.');
      return;
    }
    setLoading(true);
    try {
      const saved = await createJob({ title: jobTitle, description: jobDescription, requiredSkills, preferredSkills: '' });
      setActiveJob(saved.id);
      await refreshPipeline(saved.id);
      setSuccessMessage(`Draft requisition "${saved.title}" saved. Publish it when ready.`);
      setErrorMessage('');
      setJobTitle('');
      setRequiredSkills('');
      setJobDescription('');
      setSelectedTemplate('custom');
    } catch {
      setErrorMessage('Could not save the draft job.');
    } finally {
      setLoading(false);
    }
  };

  const createAndPublish = async () => {
    if (!jobTitle.trim() || !jobDescription.trim() || !requiredSkills.trim()) {
      setErrorMessage('Please add a job title, description, and required skills first.');
      return;
    }
    setLoading(true);
    try {
      const saved = await createJob({ title: jobTitle, description: jobDescription, requiredSkills, preferredSkills: '' });
      await publishJob(saved.id);
      setActiveJob(saved.id);
      await refreshPipeline(saved.id);
      setSuccessMessage(`Requisition "${saved.title}" created & PUBLISHED live on the Career Portal!`);
      setErrorMessage('');
      setJobTitle('');
      setRequiredSkills('');
      setJobDescription('');
      setSelectedTemplate('custom');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Could not publish the requisition.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Could not publish the requisition.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => 
        f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')
      );
      if (newFiles.length === 0) {
        setErrorMessage('Only .pdf and .docx resume files are supported.');
        return;
      }
      setBatchFiles(prev => [...prev, ...newFiles]);
      setErrorMessage('');
    }
  };

  const handleRemoveBatchFile = (index) => {
    setBatchFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleBatchDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setBatchDragActive(true);
    } else if (e.type === 'dragleave') {
      setBatchDragActive(false);
    }
  };

  const handleBatchDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBatchDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files).filter(f => 
        f.name.toLowerCase().endsWith('.pdf') || f.name.toLowerCase().endsWith('.docx')
      );
      if (dropped.length > 0) {
        setBatchFiles(prev => [...prev, ...dropped]);
        setErrorMessage('');
      } else {
        setErrorMessage('Only .pdf and .docx files are supported.');
      }
    }
  };

  const handleBatchScreen = async (e) => {
    if (e) e.preventDefault();
    if (!batchJobId || batchJobId === 'ALL') {
      setErrorMessage('Please select a target requisition to screen resumes against.');
      return;
    }
    if (!batchFiles || batchFiles.length === 0) {
      setErrorMessage('Please select or drop at least one .pdf or .docx resume.');
      return;
    }

    setBatchLoading(true);
    const formData = new FormData();
    batchFiles.forEach(file => formData.append('files', file));

    try {
      const response = await uploadResumesToJob(batchJobId, formData);
      setActiveJob(Number(batchJobId));
      await refreshPipeline(Number(batchJobId));
      setSuccessMessage(`Successfully screened and attached ${response.processed_count || batchFiles.length} resumes to requisition!`);
      setBatchFiles([]);
      setErrorMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Error processing batch resumes. Ensure backend and AI services are running.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Error processing batch resumes.');
    } finally {
      setBatchLoading(false);
    }
  };

  const publishSelected = async () => {
    if (!activeJob || activeJob === 'ALL') return;
    try {
      await publishJob(activeJob);
      await refreshPipeline(activeJob);
      setSuccessMessage('Job requisition is now PUBLISHED live on the Career Portal.');
      setErrorMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Could not publish the job requisition.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Could not publish the job requisition.');
    }
  };

  const pauseSelected = async () => {
    if (!activeJob || activeJob === 'ALL') return;
    try {
      await pauseJob(activeJob);
      await refreshPipeline(activeJob);
      setSuccessMessage('Job requisition is now PAUSED (hidden from Career Portal).');
      setErrorMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Could not pause the job requisition.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Could not pause the job requisition.');
    }
  };

  const deleteSelectedJob = async () => {
    if (!activeJob || activeJob === 'ALL') return;
    const currentJob = visibleJobs.find(j => j.id === Number(activeJob));
    const candCount = jobCounts[activeJob] || 0;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the job role "${currentJob?.title || activeJob}"?\n\nThis will permanently remove this requisition and completely wipe all ${candCount} candidate application(s) attached to it. This data cannot be recovered.`
    );
    if (!confirmed) return;
    try {
      await deleteJob(activeJob);
      if (batchJobId === String(activeJob)) {
        setBatchJobId('');
      }
      setSelectedCandidate(null);
      setActiveJob('ALL');
      await refreshPipeline('ALL');
      setSuccessMessage(`Job role "${currentJob?.title || activeJob}" and all ${candCount} candidate application(s) were permanently removed.`);
      setErrorMessage('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Could not delete the job role.';
      setErrorMessage(typeof msg === 'string' ? msg : 'Could not delete the job role.');
    }
  };

  const getResume = async (candidate) => {
    try {
      const blob = await downloadResume(candidate.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${candidate.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage('Could not download the candidate resume.');
    }
  };

  // Metrics Calculations
  const visibleJobs = jobs.filter(j => j.status !== 'CLOSED' && j.status !== 'UNPUBLISHED');
  const publishedJobsCount = visibleJobs.filter(j => j.status === 'PUBLISHED').length;
  const currentJobObj = activeJob === 'ALL' ? null : visibleJobs.find(j => j.id === Number(activeJob));
  const totalWeightSum = simWeights.skills + simWeights.experience + simWeights.education + simWeights.preferred + simWeights.context;

  const avgMatchScore = savedCandidates.length > 0 
    ? Math.round((savedCandidates.reduce((acc, c) => {
        if (!simulatorActive) return acc + (c.matchScore || 0);
        const s = computeCandidateScores(c, simWeights, true).score;
        return acc + s;
      }, 0) / savedCandidates.length) * 100)
    : 0;
  const interviewingCount = savedCandidates.filter(c => c.stage === 'INTERVIEW').length;

  // Filter & Simulation Pipeline
  const matchingCandidates = savedCandidates.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      c.name?.toLowerCase().includes(q) || 
      c.email?.toLowerCase().includes(q) || 
      c.matchExplanation?.toLowerCase().includes(q);
    const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Calculate baseline rank order (sorted by baseline matchScore desc)
  const baselineSorted = [...matchingCandidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  const baselineRankMap = new Map();
  baselineSorted.forEach((c, idx) => {
    baselineRankMap.set(c.id, idx + 1);
  });

  // Attach computed score, simulation metadata and rank shift
  const scoredCandidates = matchingCandidates.map(c => {
    const computed = computeCandidateScores(c, simWeights, simulatorActive);
    return {
      ...c,
      computedScore: computed.score,
      isSimulated: computed.isSimulated,
      parsedData: computed.parsed,
      baselineRank: baselineRankMap.get(c.id) || 1
    };
  });

  // Sort candidates: if simulatorActive, sort by computedScore desc, else baseline matchScore desc
  const filteredCandidates = [...scoredCandidates].sort((a, b) => {
    if (simulatorActive) {
      return (b.computedScore || 0) - (a.computedScore || 0);
    }
    return (b.matchScore || 0) - (a.matchScore || 0);
  }).map((c, idx) => {
    const simulatedRank = idx + 1;
    const rankShift = c.baselineRank - simulatedRank;
    return {
      ...c,
      simulatedRank,
      rankShift
    };
  });

  const getScoreBadge = (score, isSimulated = false) => {
    if (score == null) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Pending</span>
        </span>
      );
    }
    const pct = Math.round(score * 100);
    if (isSimulated) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950/80 text-violet-300 border border-violet-500/40 shadow-sm" title="Calibrated Match Score based on active criteria weights">
          <Sliders className="w-3 h-3 text-violet-400" />
          <span><span className="font-mono font-bold">{pct}%</span> Calibrated</span>
        </span>
      );
    }
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span><span className="font-mono font-bold">{pct}%</span> Strong Match</span>
        </span>
      );
    }
    if (pct >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          <span><span className="font-mono font-bold">{pct}%</span> Good Match</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
        <span><span className="font-mono font-bold">{pct}%</span> Low Match</span>
      </span>
    );
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'INTERVIEW':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Interview</span>;
      case 'OFFER':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Offer</span>;
      case 'HIRED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-950/70 text-green-300 border border-green-500/30"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />Hired</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-500/30"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{stage || 'NEW'}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Enterprise Top Navbar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-950">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">Nexus CV</span>
                <span className="ml-2 text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/20">Enterprise ATS</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 pl-2 sm:pl-4 border-l border-slate-800 text-xs font-medium">
              <a href="/dashboard" className="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-slate-800 text-white">Recruitment Pipeline</a>
              <a href="/careers" className="px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">Career Portal</a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Authenticated:</span>
              <span className="font-semibold text-white">{localStorage.getItem('user') || 'admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Global Alerts Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage('')}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')}><X className="w-4 h-4 text-emerald-400" /></button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Requisitions</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{publishedJobsCount}</span>
              <span className="text-xs text-slate-500 font-mono">of {visibleJobs.length} active</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Pipeline</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{savedCandidates.length}</span>
              <span className="text-xs text-slate-500">
                {activeJob === 'ALL' ? 'applicants across all roles' : 'applicants in role'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Match</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{avgMatchScore}%</span>
              <span className="text-xs text-slate-500">across candidates</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interview Stage</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">{interviewingCount}</span>
              <span className="text-xs text-slate-500">shortlisted candidates</span>
            </div>
          </div>
        </div>

        {/* 2-Column Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Job Authoring & Standalone Batch Ingestion (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              {/* Feature Tab Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setLeftFeatureTab('CREATE')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    leftFeatureTab === 'CREATE'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>1. Post Requisition</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLeftFeatureTab('BATCH_UPLOAD');
                    if (!batchJobId && activeJob && activeJob !== 'ALL') {
                      setBatchJobId(String(activeJob));
                    } else if (!batchJobId && visibleJobs.length > 0) {
                      setBatchJobId(String(visibleJobs[0].id));
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    leftFeatureTab === 'BATCH_UPLOAD'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>2. Batch Ingestion</span>
                  {visibleJobs.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              {leftFeatureTab === 'CREATE' ? (
                /* Feature 1: Requisition Authoring */
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <h2 className="font-bold text-white text-base">New Job Requisition</h2>
                    </div>
                    <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Job Authoring</span>
                  </div>

                  {/* Template Selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Preset Role Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="custom">-- Custom Requisition --</option>
                      {Object.keys(JOB_TEMPLATES).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); saveDraft(); }} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Backend Engineer"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Required Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Java, Spring Boot, SQL, Docker"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        value={requiredSkills}
                        onChange={e => setRequiredSkills(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Job Description & Qualifications
                      </label>
                      <textarea
                        placeholder="Paste job details, responsibilities, and criteria..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                        value={jobDescription}
                        onChange={e => setJobDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={saveDraft}
                        className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-50"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={createAndPublish}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Publishing...' : 'Publish Live Now'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Feature 2: Standalone Batch Resume Ingestion */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-indigo-400" />
                      <h2 className="font-bold text-white text-base">Batch Resume Screening</h2>
                    </div>
                    <span className="text-[11px] bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                      Direct Ingestion
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Screen batches of candidate resumes directly against any existing job opening without posting a new job.
                  </p>

                  {/* Step 1: Target Requisition Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Step 1: Target Existing Requisition
                    </label>
                    <select
                      value={batchJobId}
                      onChange={e => setBatchJobId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="">-- Select an Existing Requisition --</option>
                      {visibleJobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} [{job.status}] ({jobCounts[job.id] || 0} applicants)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Job Criteria Preview Card */}
                  {(() => {
                    const targetJob = visibleJobs.find(j => j.id === Number(batchJobId));
                    if (!targetJob) return null;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{targetJob.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            targetJob.status === 'PUBLISHED' 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                          }`}>
                            {targetJob.status}
                          </span>
                        </div>
                        {targetJob.requiredSkills && (
                          <div className="flex flex-wrap gap-1">
                            {targetJob.requiredSkills.split(',').map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/20 text-[10px] font-medium text-indigo-300">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Step 2: Multi-File Resume Dropzone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Step 2: Upload Resumes (.pdf or .docx)
                    </label>
                    <div
                      onDragEnter={handleBatchDrag}
                      onDragLeave={handleBatchDrag}
                      onDragOver={handleBatchDrag}
                      onDrop={handleBatchDrop}
                      className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        batchDragActive 
                          ? 'border-indigo-500 bg-indigo-950/30' 
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                      }`}
                      onClick={() => document.getElementById('batchResumeInput')?.click()}
                    >
                      <input
                        id="batchResumeInput"
                        type="file"
                        multiple
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={handleBatchFileChange}
                      />
                      <UploadCloud className="w-7 h-7 mx-auto mb-2 text-indigo-400/80" />
                      <p className="text-xs font-semibold text-white">
                        Click to browse or drag & drop resume files here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supports multiple PDF and DOCX files
                      </p>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {batchFiles.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">{batchFiles.length} file{batchFiles.length === 1 ? '' : 's'} queued</span>
                        <button
                          type="button"
                          onClick={() => setBatchFiles([])}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {batchFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-500">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBatchFile(idx);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Run Batch Screening */}
                  <button
                    type="button"
                    disabled={batchLoading || !batchJobId || batchFiles.length === 0}
                    onClick={handleBatchScreen}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white shadow-md shadow-indigo-950 transition-all flex items-center justify-center gap-2"
                  >
                    {batchLoading ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Screening {batchFiles.length} Resumes with AI...</span>
                      </>
                    ) : (
                      <span>
                        {batchFiles.length > 0 
                          ? `Screen & Ingest ${batchFiles.length} Resume${batchFiles.length === 1 ? '' : 's'}`
                          : 'Select Resumes to Screen'}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Role & Candidate Pipeline (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
              {/* Job Selector & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Active Requisition Pipeline
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    value={activeJob}
                    onChange={e => handleJobSelect(e.target.value)}
                  >
                    <option value="ALL">
                      All Requisitions ({allCandidates.length} total {allCandidates.length === 1 ? 'applicant' : 'applicants'})
                    </option>
                    {visibleJobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {jobCounts[job.id] || 0} applicants [{job.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {currentJobObj ? (
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-4">
                    {currentJobObj.status === 'PUBLISHED' && (
                      <>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Live on Career Portal</span>
                        </span>
                        <button
                          onClick={pauseSelected}
                          className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Hide this job opening from the Career Portal"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause Intake</span>
                        </button>
                        <button
                          onClick={deleteSelectedJob}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Permanently delete this job role and wipe candidate applications"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Job Role</span>
                        </button>
                      </>
                    )}

                    {currentJobObj.status === 'PAUSED' && (
                      <>
                        <span className="px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                          <Pause className="w-3.5 h-3.5" />
                          <span>Paused (Hidden)</span>
                        </span>
                        <button
                          onClick={publishSelected}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                          title="Republish live on the Career Portal"
                        >
                          <Play className="w-3 h-3" />
                          <span>Resume / Publish Live</span>
                        </button>
                        <button
                          onClick={deleteSelectedJob}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Permanently delete this job role and wipe candidate applications"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Job Role</span>
                        </button>
                      </>
                    )}

                    {currentJobObj.status === 'DRAFT' && (
                      <>
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Draft Requisition</span>
                        </span>
                        <button
                          onClick={publishSelected}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Publish Live</span>
                        </button>
                        <button
                          onClick={deleteSelectedJob}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Permanently delete this draft job role and wipe candidate applications"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete Job Role</span>
                        </button>
                      </>
                    )}

                    {(currentJobObj.status === 'CLOSED' || currentJobObj.status === 'UNPUBLISHED') && (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5" />
                          <span>Permanently Closed (Dataset Cleared)</span>
                        </span>
                        <span className="text-xs text-slate-500 italic hidden sm:inline">
                          Position permanently closed. Cannot be republished.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 sm:pt-4 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      Viewing all applications across company
                    </span>
                  </div>
                )}
              </div>

              {/* Filter & Search Toolbar */}
              {activeJob && (
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search applicants by name, email, or skill keywords..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Stage:</span>
                      <select
                        value={stageFilter}
                        onChange={e => setStageFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">All Stages</option>
                        <option value="NEW">New</option>
                        <option value="REVIEW">Review</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimulatorOpen(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        simulatorActive
                          ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 shadow-sm shadow-violet-950'
                          : simulatorOpen
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                      }`}
                      title="Open Criteria Calibration to adjust evaluation weights and re-rank candidates in real-time"
                    >
                      <Sliders className="w-3.5 h-3.5 text-violet-400" />
                      <span>Criteria Calibration</span>
                      {simulatorActive && (
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Criteria Calibration Panel */}
              {simulatorOpen && activeJob && (
                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900/90 border border-violet-500/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                          <span>Dynamic Criteria Calibration</span>
                          {simulatorActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300 uppercase tracking-wider">
                              Live Re-ranking Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 uppercase tracking-wider">
                              Preview Mode (Baseline)
                            </span>
                          )}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        Adjust evaluation weights in real time to calibrate candidate rankings under varying hiring priorities.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setSimulatorActive(prev => !prev)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          simulatorActive
                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <span>{simulatorActive ? '✓ Calibration Active' : 'Apply Calibration'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetSimulator}
                        className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                        title="Reset weights to default baseline"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Weight Sliders Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {/* 1. Required Technical Skills */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-300">Required Skills Coverage</span>
                        <span className="font-mono font-bold text-white">{simWeights.skills}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simWeights.skills}
                        onChange={e => handleWeightChange('skills', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>Core technical competencies</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 2. Experience Alignment */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-300">Experience Seniority</span>
                        <span className="font-mono font-bold text-white">{simWeights.experience}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simWeights.experience}
                        onChange={e => handleWeightChange('experience', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>Historical tenure & seniority</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 3. Education Criteria */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyan-300">Education Criteria</span>
                        <span className="font-mono font-bold text-white">{simWeights.education}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simWeights.education}
                        onChange={e => handleWeightChange('education', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>Academic pedigree & degrees</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 4. Preferred Skills Fit */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-violet-300">Preferred Stack Fit</span>
                        <span className="font-mono font-bold text-white">{simWeights.preferred}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simWeights.preferred}
                        onChange={e => handleWeightChange('preferred', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>Secondary / bonus toolsets</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 5. Semantic / Contextual Fit */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-300">Semantic & Domain Context</span>
                        <span className="font-mono font-bold text-white">{simWeights.context}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simWeights.context}
                        onChange={e => handleWeightChange('context', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>Lexical relevance & phrasing</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Normalized Distribution Bar & Summary */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Normalized Balance</span>
                        <span className="font-mono text-[11px] text-slate-400">Sum: {totalWeightSum}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
                        {totalWeightSum > 0 ? (
                          <>
                            <div style={{ width: `${(simWeights.skills / totalWeightSum) * 100}%` }} className="bg-indigo-500 h-full" title={`Skills: ${Math.round((simWeights.skills / totalWeightSum) * 100)}%`} />
                            <div style={{ width: `${(simWeights.experience / totalWeightSum) * 100}%` }} className="bg-emerald-500 h-full" title={`Experience: ${Math.round((simWeights.experience / totalWeightSum) * 100)}%`} />
                            <div style={{ width: `${(simWeights.education / totalWeightSum) * 100}%` }} className="bg-cyan-500 h-full" title={`Education: ${Math.round((simWeights.education / totalWeightSum) * 100)}%`} />
                            <div style={{ width: `${(simWeights.preferred / totalWeightSum) * 100}%` }} className="bg-violet-500 h-full" title={`Preferred: ${Math.round((simWeights.preferred / totalWeightSum) * 100)}%`} />
                            <div style={{ width: `${(simWeights.context / totalWeightSum) * 100}%` }} className="bg-amber-500 h-full" title={`Context: ${Math.round((simWeights.context / totalWeightSum) * 100)}%`} />
                          </>
                        ) : (
                          <div className="w-full bg-slate-800 h-full" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        {simulatorActive 
                          ? 'Candidates below are dynamically re-ranked according to this calibrated model.'
                          : 'Click "Apply Calibration" above to dynamically re-order candidates in real time.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              {activeJob ? (
                <div className="mt-4 space-y-3">
                  {filteredCandidates.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6">
                      <Users className="w-10 h-10 mx-auto mb-3 text-indigo-400/60" />
                      <h4 className="text-sm font-bold text-white mb-1">No Applications For This Requisition Yet</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                        {currentJobObj?.status === 'PUBLISHED'
                          ? 'This role is published live. Candidates who apply via the Career Portal (/careers) will automatically appear in this pipeline, or you can ingest resumes in bulk directly.'
                          : 'This requisition is in DRAFT status. Click "Publish Live" above to open it for applications, or screen resumes using the Batch Ingestion tool.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {currentJobObj && (
                          <button
                            type="button"
                            onClick={() => {
                              setBatchJobId(String(currentJobObj.id));
                              setLeftFeatureTab('BATCH_UPLOAD');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-colors"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Batch Screen Resumes for this Role</span>
                          </button>
                        )}
                        {currentJobObj?.status === 'PUBLISHED' && (
                          <a
                            href="/careers"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                          >
                            <span>Open Career Portal</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    filteredCandidates.map(candidate => {
                      const parsed = candidate.parsedData || parseCandidateExplanation(candidate.matchExplanation);
                      return (
                        <div
                          key={candidate.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group ${
                            simulatorActive
                              ? 'bg-slate-950/80 border-violet-500/20 hover:border-violet-500/50 hover:bg-slate-950'
                              : 'bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {simulatorActive && (
                                <span className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/40 text-violet-300 font-bold flex items-center justify-center text-xs font-mono" title={`Calibrated Rank #${candidate.simulatedRank}`}>
                                  #{candidate.simulatedRank}
                                </span>
                              )}
                              <span className="font-bold text-white text-sm">{candidate.name}</span>
                              {getStageBadge(candidate.stage)}
                              {getScoreBadge(candidate.computedScore, candidate.isSimulated)}
                              {simulatorActive && candidate.rankShift !== 0 && (
                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  candidate.rankShift > 0 
                                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                                    : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                                }`} title={`Rank shifted from baseline #${candidate.baselineRank} to #${candidate.simulatedRank}`}>
                                  {candidate.rankShift > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  <span>{candidate.rankShift > 0 ? `+${candidate.rankShift}` : candidate.rankShift}</span>
                                </span>
                              )}
                              {simulatorActive && (
                                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                                  (baseline: {Math.round((candidate.matchScore || 0) * 100)}%)
                                </span>
                              )}
                              {candidate.jobTitle && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                                  Role: {candidate.jobTitle}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {candidate.email ? candidate.email : 'No email provided'} &bull; Source: <span className="text-slate-300 font-medium">{candidate.source === 'CAREERS_PAGE' ? 'Career Portal' : (candidate.source || 'Direct intake')}</span>
                            </p>
                            <p className="text-xs text-slate-400 italic line-clamp-2 max-w-xl">
                              {parsed.explanation || 'Analysis pending or manual evaluation required.'}
                            </p>

                            {/* Skill Match Breakdown Highlights on Card */}
                            {(parsed.strengths?.length > 0 || parsed.skill_gaps?.length > 0 || parsed.top_matching_terms?.length > 0) && (
                              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                {parsed.strengths?.slice(0, 3).map((s, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-[10px] font-medium text-emerald-300">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>{s}</span>
                                  </span>
                                ))}
                                {parsed.skill_gaps?.slice(0, 2).map((g, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/70 border border-rose-500/30 text-[10px] font-medium text-rose-300">
                                    <XCircle className="w-2.5 h-2.5 text-rose-400" />
                                    <span>{g}</span>
                                  </span>
                                ))}
                                {parsed.top_matching_terms?.slice(0, 3).map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[10px] font-medium text-slate-300">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 flex-shrink-0">
                            {candidate.resumeAvailable && (
                              <button
                                onClick={() => getResume(candidate)}
                                className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1"
                                title="Download Resume"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="sm:hidden">Resume</span>
                              </button>
                            )}
                            <button
                              onClick={() => reviewCandidate(candidate)}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold text-xs transition-colors"
                            >
                              Review & Stage
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 p-6">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white mb-1">
                    {jobs.length === 0 ? 'No Requisitions Found in Database' : 'Select a Saved Requisition Above'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    {jobs.length === 0
                      ? 'Create a requisition using one of the templates on the left (e.g. Frontend Engineer) and click "Save Draft Requisition", then "Publish Live".'
                      : 'Choose a role from the "Active Requisition Pipeline" dropdown above to display candidate profiles.'}
                  </p>
                  {jobs.length === 0 && (
                    <button
                      onClick={() => applyTemplate('Frontend Engineer')}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                    >
                      Load Frontend Engineer Template
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detailed Candidate Evaluation Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {getStageBadge(selectedCandidate.stage)}
                {selectedCandidate.jobTitle && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    Requisition: {selectedCandidate.jobTitle}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white">{selectedCandidate.filename}</h2>
              {selectedCandidate.email && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>Applicant Email:</span>
                  <span className="text-slate-200 font-mono font-medium">{selectedCandidate.email}</span>
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                {getScoreBadge(selectedCandidate.final_score, selectedCandidate.isSimulated)}
                <span className="text-xs text-slate-400">
                  {selectedCandidate.isSimulated 
                    ? `Calibrated match under custom weights (Baseline: ${Math.round((selectedCandidate.baselineScore || 0) * 100)}%)` 
                    : 'Advisory match calculated across multi-component dimensions'}
                </span>
              </div>
            </div>

            {/* Component Dimension Scores (if available) */}
            {(selectedCandidate.skills_required_score != null || selectedCandidate.experience_score != null || selectedCandidate.education_score != null || selectedCandidate.global_context_score != null) && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Skill & Component Dimension Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedCandidate.skills_required_score != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Required Skills Coverage</span>
                        <span className="font-mono text-indigo-300 font-bold">{Math.round(selectedCandidate.skills_required_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Math.round(selectedCandidate.skills_required_score * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                  {selectedCandidate.skills_preferred_score != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Preferred Skills Fit</span>
                        <span className="font-mono text-violet-300 font-bold">{Math.round(selectedCandidate.skills_preferred_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-violet-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Math.round(selectedCandidate.skills_preferred_score * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                  {selectedCandidate.experience_score != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Experience Alignment</span>
                        <span className="font-mono text-emerald-300 font-bold">{Math.round(selectedCandidate.experience_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Math.round(selectedCandidate.experience_score * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                  {selectedCandidate.education_score != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Education Criteria</span>
                        <span className="font-mono text-cyan-300 font-bold">{Math.round(selectedCandidate.education_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Math.round(selectedCandidate.education_score * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                  {selectedCandidate.global_context_score != null && (
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Semantic & Global Context Relevance</span>
                        <span className="font-mono text-amber-300 font-bold">{Math.round(selectedCandidate.global_context_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, Math.round(selectedCandidate.global_context_score * 100)))}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Strengths & Missing Gaps */}
            {selectedCandidate.strengths?.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Key Strengths & Matched Competencies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.strengths.map((str, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium">
                      ✓ {str}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCandidate.skill_gaps?.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Skill Gaps & Competencies to Probe
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skill_gaps.map((gap, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs font-medium">
                      ✕ {gap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCandidate.top_matching_terms?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Top Matching Domain Terms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.top_matching_terms.map((term, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono">
                      #{term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Advisory Text */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Recruiter Advisory Note
              </span>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                &ldquo;{selectedCandidate.recruiter_explanation || 'Candidate record ready for manual evaluation.'}&rdquo;
              </p>
            </div>

            {/* Audit History Timeline */}
            {history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Decision Audit History (Immutable)
                </span>
                <div className="space-y-2">
                  {history.map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between gap-2">
                      <div>
                        <span className="font-semibold text-white">{evt.fromStage} &rarr; {evt.toStage}</span>
                        <span className="text-slate-400 text-[11px] ml-2">by {evt.actor}</span>
                        <p className="text-slate-300 mt-0.5 italic">&ldquo;{evt.reason}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Stage Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2.5 justify-end">
              <button
                onClick={() => openDecisionModal('REJECTED', selectedCandidate)}
                className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors"
              >
                Reject with Reason
              </button>
              <button
                onClick={() => openDecisionModal('INTERVIEW', selectedCandidate)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950 transition-colors"
              >
                Advance to Interview &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Stage Decision Modal (REPLACES BROWSER window.prompt) */}
      {stageModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Stage Decision Justification</h3>
              </div>
              <button
                onClick={() => setStageModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Moving <strong className="text-white">{stageModal.candidate?.filename || stageModal.candidate?.name}</strong> to stage{' '}
              <strong className="text-indigo-400 uppercase font-mono">{stageModal.stage}</strong>.
              Enter a mandatory explanation for the compliance audit trail.
            </p>

            {/* Quick Reason Presets */}
            {STAGE_PRESET_REASONS[stageModal.stage] && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Quick-Fill Presets (Click to Insert)
                </label>
                <div className="flex flex-col gap-1.5">
                  {STAGE_PRESET_REASONS[stageModal.stage].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStageModal(prev => ({ ...prev, reason: preset, validationError: '' }))}
                      className="text-left text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 text-slate-300 transition-colors"
                    >
                      &bull; {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Written Justification Rationale
              </label>
              <textarea
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                placeholder="Enter specific feedback or reason..."
                value={stageModal.reason}
                onChange={e => setStageModal(prev => ({ ...prev, reason: e.target.value, validationError: '' }))}
              />
              {stageModal.validationError && (
                <p className="text-xs text-rose-400 mt-1">{stageModal.validationError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStageModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={stageModal.isSubmitting}
                onClick={handleConfirmDecision}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-indigo-950 transition-colors"
              >
                {stageModal.isSubmitting ? 'Logging Event...' : 'Confirm & Log Audit Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}