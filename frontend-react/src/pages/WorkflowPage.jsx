import { useState, useEffect } from 'react';
import { 
  Flame, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Layers, 
  Lock, 
  Scale,
  Award,
  BookOpen
} from 'lucide-react';

const WORKFLOW_STAGES = [
  {
    id: 1,
    title: "1. Posting a Job Opening",
    badge: "Recruiter Dashboard",
    tier: "Frontend & Java Gateway",
    icon: FileText,
    flameColor: "from-amber-600 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
    summary: "A recruiter fills out what they need for a role—including the job description, required skills, and experience level.",
    details: [
      "The job starts as a private draft so the recruiter can write and review it at their own pace.",
      "Clicking 'Publish' makes the job live on our public careers page immediately.",
      "Everything is saved in a local H2 relational database so no data is lost when servers restart.",
      "Recruiters can customize required skills, nice-to-have skills, and minimum experience years."
    ],
    technicalFact: "Uses Spring Data JPA with Flyway database migrations so the schema stays consistent and reliable."
  },
  {
    id: 2,
    title: "2. Receiving Resumes Safely",
    badge: "Candidate Application",
    tier: "Java Gateway (Port 8080)",
    icon: Lock,
    flameColor: "from-orange-600 to-red-500",
    glowColor: "rgba(234, 88, 12, 0.4)",
    summary: "Job seekers visit the careers page and apply by submitting their contact information and a PDF or Word (.docx) resume.",
    details: [
      "Checks if the applicant's email has already applied for this job to prevent accidental duplicates or spam.",
      "Renames uploaded files with random unique IDs and stores them in a private server folder—never exposed to public URLs.",
      "Calculates a SHA-256 fingerprint for each file to ensure the uploaded document is intact and untampered.",
      "Built for reliability: If the AI scoring engine happens to be offline or slow, the application is still safely saved as 'NEW' for manual review."
    ],
    technicalFact: "Candidate resumes are strictly accessible only by authenticated recruiters through protected API endpoints."
  },
  {
    id: 3,
    title: "3. Reading & Cleaning the Resume Text",
    badge: "Python Ingestion",
    tier: "FastAPI Bridge (Port 8000)",
    icon: Cpu,
    flameColor: "from-red-600 to-rose-500",
    glowColor: "rgba(220, 38, 38, 0.4)",
    summary: "Resumes arrive in many different layouts. Our Python service reads the file and extracts clean, readable text.",
    details: [
      "Uses pdfplumber for PDFs and python-docx for Word files to reliably extract text paragraphs and tables.",
      "Cleans up unusual formatting, special symbols, and extra whitespace to ensure clean input data.",
      "Smart skill detection: Uses regex word boundaries so short words aren't falsely matched inside bigger words (for example, it won't mistake 'CSS' for 'C' or 'Trust' for 'Rust').",
      "Separates the resume into logical sections: Work Experience, Education, Projects, and Skills."
    ],
    technicalFact: "Java sends documents to Python over an internal HTTP bridge protected by a shared secret key (X-AI-Service-Key)."
  },
  {
    id: 4,
    title: "4. Scoring the Resume Across 6 Key Areas",
    badge: "Multi-Component Scoring",
    tier: "NLP & Vector Engine",
    icon: Sparkles,
    flameColor: "from-rose-600 to-amber-500",
    glowColor: "rgba(225, 29, 72, 0.4)",
    summary: "Instead of relying on a single mysterious number, we score candidates across six clear and practical hiring factors.",
    details: [
      "Required Skills (30% weight): Does the applicant have the essential tools and technologies for the job?",
      "Relevant Experience (20% weight): Does their work history match the years of experience the team asked for?",
      "Overall Wording Match / TF-IDF (15% weight): Compares the overall vocabulary of the resume with the job description using cosine similarity.",
      "Education Level (15% weight): Checks how their degree matches the role requirements.",
      "Projects & Certifications (10% weight): Gives credit for hands-on projects, open-source work, and professional certifications.",
      "Preferred Skills (10% weight): Extra credit for nice-to-have capabilities that make a candidate stand out."
    ],
    technicalFact: "We dynamically adjust TF-IDF thresholds so shared industry terms aren't accidentally removed when reviewing small groups of applicants."
  },
  {
    id: 5,
    title: "5. Giving the Recruiter an Easy-to-Read Summary",
    badge: "Explainable AI",
    tier: "ML & Explanation Pipeline",
    icon: Scale,
    flameColor: "from-amber-500 to-orange-600",
    glowColor: "rgba(245, 158, 11, 0.4)",
    summary: "The system translates complex math into clear, plain-English notes so recruiters can quickly understand why someone scored well.",
    details: [
      "Lists the candidate's top strengths and specifically highlights which required skills they possess.",
      "Clearly identifies skill gaps so the hiring team knows what topics to explore during an interview.",
      "Runs through a calibrated logistic model to estimate an advisory suitability percentage.",
      "Tested for fairness: Paraphrasing or re-ordering sentences on a resume has less than a 6% variance on the final score."
    ],
    technicalFact: "AI feedback is strictly advisory: it helps human recruiters review faster, but never makes automatic hiring decisions."
  },
  {
    id: 6,
    title: "6. The Human Recruiter Makes the Final Call",
    badge: "Accountability & Auditing",
    tier: "Spring Data JPA & H2",
    icon: ShieldCheck,
    flameColor: "from-orange-500 to-amber-600",
    glowColor: "rgba(234, 88, 12, 0.4)",
    summary: "Human recruiters make every hiring decision, and every decision requires a written explanation that is permanently logged.",
    details: [
      "Recruiters move applicants through stages: Review, Interview, Offer, Hired, or Rejected.",
      "Mandatory explanation: The system requires the recruiter to enter a written reason before updating any candidate's stage.",
      "Every action logs the recruiter's name, previous stage, new stage, reason, and exact timestamp into the database.",
      "Creates complete transparency and accountability, avoiding unmonitored automated rejections."
    ],
    technicalFact: "The entire review history is preserved in the review_events table and viewable inside the recruiter dashboard."
  }
];

export default function WorkflowPage() {
  const [activeStage, setActiveStage] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Automated step-by-step walkthrough
  useEffect(() => {
    let timer;
    if (isSimulating) {
      if (simulationStep < WORKFLOW_STAGES.length) {
        timer = setTimeout(() => {
          setActiveStage(simulationStep + 1);
          setSimulationStep(prev => prev + 1);
        }, 2000);
      } else {
        setIsSimulating(false);
        setSimulationStep(0);
      }
    }
    return () => clearTimeout(timer);
  }, [isSimulating, simulationStep]);

  const startSimulation = () => {
    setSimulationStep(0);
    setActiveStage(1);
    setIsSimulating(true);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationStep(0);
    setActiveStage(1);
  };

  const currentStageData = WORKFLOW_STAGES.find(s => s.id === activeStage) || WORKFLOW_STAGES[0];
  const StageIcon = currentStageData.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans selection:bg-orange-600 selection:text-white">
      {/* Flame Pattern & Rising Embers Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft atmospheric flame glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-t from-red-600/25 via-orange-500/15 to-transparent blur-3xl rounded-full animate-pulse" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-orange-600/10 blur-3xl rounded-full" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-red-600/10 blur-3xl rounded-full" />
        
        {/* Subtle geometric pattern */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 115, 0, 0.4) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(239, 68, 68, 0.3) 2%, transparent 0%)`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Floating Ember Particles */}
        <div className="absolute inset-0">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-t from-orange-400 to-amber-200 animate-ping opacity-60"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 6 + 3}px`,
                left: `${(i * 6.2) + Math.random() * 3}%`,
                bottom: `${Math.random() * 80 + 10}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${(i % 5) * 0.4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-orange-950/60 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 shadow-lg shadow-orange-950/60">
              <Flame className="w-6 h-6 text-slate-950 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-orange-400 to-red-500 bg-clip-text text-transparent">
                Nexus CV
              </h1>
              <p className="text-xs text-orange-300/70 tracking-widest uppercase font-semibold">
                System Architecture & Workflow Overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="/careers" 
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-orange-500/30 text-orange-300 hover:bg-orange-500/10 transition-colors"
            >
              Career Portal
            </a>
            <a 
              href="/login" 
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white shadow-md shadow-orange-950/60 transition-all transform hover:-translate-y-0.5"
            >
              Recruiter Login
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-300 text-xs font-semibold mb-4 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>Advisory AI System &bull; Human Recruiters Make the Final Decision</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            How An Application Moves Through <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Nexus CV</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Here is how our project works from start to finish—from when a recruiter posts a job and a candidate uploads their resume, to how our AI scores it and how human recruiters make fair hiring decisions.
          </p>

          {/* Interactive Simulation Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={startSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                isSimulating 
                  ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-slate-950 hover:brightness-110 shadow-orange-950/80 transform hover:scale-105'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isSimulating ? `Showing Step ${simulationStep + 1} of 6...` : 'Run Live Flow Walkthrough'}
            </button>
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset View
            </button>
          </div>
        </div>

        {/* 6 Stage Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {WORKFLOW_STAGES.map((stage) => {
            const Icon = stage.icon;
            const isSelected = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => { setIsSimulating(false); setActiveStage(stage.id); }}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-slate-900/90 border-orange-500/80 shadow-lg shadow-orange-900/40 ring-1 ring-orange-400/50 scale-[1.02]' 
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-orange-500/40 hover:bg-slate-900/70'
                }`}
              >
                {/* Active flame border pulse */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 animate-pulse" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Step {stage.id}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-400' : 'text-slate-500 group-hover:text-orange-400'}`} />
                </div>
                <h3 className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {stage.title.split('. ')[1]}
                </h3>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {stage.tier}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Spotlight Panel */}
        <div className="bg-slate-900/70 border border-orange-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden mb-12">
          {/* Flame Corner Glow Accent */}
          <div 
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
            style={{ backgroundColor: currentStageData.glowColor }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
            {/* Left: Stage Overview & Badges */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${currentStageData.flameColor} text-slate-950 shadow-md shadow-orange-950`}>
                  <StageIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                    {currentStageData.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {currentStageData.title}
                  </h3>
                </div>
              </div>

              <p className="text-slate-200 text-sm leading-relaxed">
                {currentStageData.summary}
              </p>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How This Works Under the Hood:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {currentStageData.technicalFact}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                <span>Handled by:</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-orange-300 font-mono font-semibold">
                  {currentStageData.tier}
                </span>
              </div>
            </div>

            {/* Right: Key Process Breakdown Details */}
            <div className="lg:col-span-7 bg-slate-950/90 rounded-xl border border-orange-500/20 p-5 sm:p-6 space-y-4 shadow-inner">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                Step-by-Step Breakdown
              </h4>

              <div className="space-y-3">
                {currentStageData.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{detail}</span>
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setActiveStage(prev => Math.max(1, prev - 1))}
                  disabled={activeStage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  &larr; Previous Step
                </button>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  Step {activeStage} of 6
                </span>
                <button
                  onClick={() => setActiveStage(prev => Math.min(WORKFLOW_STAGES.length, prev + 1))}
                  disabled={activeStage === WORKFLOW_STAGES.length}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600/20 border border-orange-500/40 text-orange-300 hover:bg-orange-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next Step &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Tier System Architecture Matrix */}
        <div className="mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-extrabold text-white">
              How the System is Built: 3-Tier Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              We separated the frontend, backend, and AI service cleanly so each part does what it does best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Tier 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-orange-500/20 hover:border-orange-500/50 transition-all shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  PORT 5173
                </span>
                <Layers className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">1. The User Interface</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Built with React 18 and Vite. It gives job candidates a clean application form and gives recruiters a comprehensive dashboard.
              </p>
              <ul className="text-xs text-slate-200 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Public job browsing on /careers</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Secure recruiter dashboard login</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Visual score cards and candidate review</span>
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-orange-500/40 hover:border-orange-500/70 transition-all shadow-xl group relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                System of Record
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  PORT 8080
                </span>
                <Database className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">2. The Backend Gateway</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Built with Java 17 and Spring Boot. It manages the H2 database, stores resumes privately on disk, and enforces security.
              </p>
              <ul className="text-xs text-slate-200 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Saves jobs and candidate applications</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Keeps resumes private and securely stored</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Records the mandatory recruiter audit log</span>
                </li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-orange-500/20 hover:border-orange-500/50 transition-all shadow-xl group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  PORT 8000
                </span>
                <Cpu className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">3. The Python AI Service</h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Built with Python 3.12 and FastAPI. It does the heavy lifting of reading resumes, extracting skills, and computing match scores.
              </p>
              <ul className="text-xs text-slate-200 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Extracts text from PDF and Word files</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Calculates transparent 6-factor scores</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                  <span>Generates candidate strengths and skill gaps</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scoring Breakdown & Weights Reference */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-950 to-orange-950/30 border border-orange-500/30 rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-black text-white">
              How the Overall Match Score is Calculated (100% Total)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-orange-400">30%</p>
              <p className="text-xs font-bold text-white mt-1">Required Skills</p>
              <p className="text-[10px] text-slate-300 mt-1">Must-have skills for the position</p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-amber-400">20%</p>
              <p className="text-xs font-bold text-white mt-1">Experience</p>
              <p className="text-[10px] text-slate-300 mt-1">Years worked vs. target level</p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-red-400">15%</p>
              <p className="text-xs font-bold text-white mt-1">Wording Match</p>
              <p className="text-[10px] text-slate-300 mt-1">Overall resume wording similarity</p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-rose-400">15%</p>
              <p className="text-xs font-bold text-white mt-1">Education</p>
              <p className="text-[10px] text-slate-300 mt-1">Degree level alignment</p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-orange-400">10%</p>
              <p className="text-xs font-bold text-white mt-1">Projects & Certs</p>
              <p className="text-[10px] text-slate-300 mt-1">Certificates, licenses & portfolio</p>
            </div>
            <div className="bg-slate-950/80 p-4 rounded-xl border border-orange-500/20 text-center">
              <p className="text-2xl font-black text-amber-400">10%</p>
              <p className="text-xs font-bold text-white mt-1">Preferred Skills</p>
              <p className="text-[10px] text-slate-300 mt-1">Nice-to-have bonus capabilities</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-slate-900 text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <span>Built for academic presentation and human-in-the-loop ethical hiring research.</span>
            <BookOpen className="w-3.5 h-3.5 text-orange-400 inline" />
          </p>
          <p className="mt-1 text-slate-400">
            Nexus CV &bull; Spring Boot 3.3 Gateway &bull; Python FastAPI NLP &bull; React 18 UI
          </p>
        </footer>
      </div>
    </div>
  );
}