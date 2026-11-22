import { useEffect, useState, useRef } from 'react';
import { publicJobs, applyForJob } from '../services/api';
import { 
  Briefcase, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  UploadCloud, 
  FileText, 
  X, 
  ChevronRight 
} from 'lucide-react';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const applyFormRef = useRef(null);

  useEffect(() => {
    document.title = 'Career Portal';
    publicJobs()
      .then(setJobs)
      .catch(() => setMessage('Could not load open requisitions. Please refresh or try again later.'));
  }, []);

  const handleSelectJob = (job) => {
    setSelected(job);
    setMessage('');
    setIsDuplicate(false);
    setReceipt(null);
    setTimeout(() => {
      applyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.pdf', '.docx'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setMessage('Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size exceeds the 10 MB limit. Please upload a smaller file.');
      return;
    }
    setMessage('');
    setResume(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selected || !resume) {
      setMessage('Please attach your resume (PDF or DOCX) before submitting.');
      return;
    }
    setLoading(true);
    setMessage('');
    setIsDuplicate(false);
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('resume', resume);

    try {
      const res = await applyForJob(selected.id, form);
      setReceipt(res);
      setName('');
      setEmail('');
      setResume(null);
      event.target.reset();
    } catch (error) {
      if (error.response?.status === 409) {
        setIsDuplicate(true);
      }
      const errText = typeof error.response?.data === 'string'
        ? error.response.data
        : (error.response?.data?.detail || error.response?.data?.message || 'Your application could not be submitted. Please verify the document and try again.');
      setMessage(errText);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = job.title?.toLowerCase().includes(query);
    const matchesSkills = job.requiredSkills?.toLowerCase().includes(query);
    const matchesDesc = job.description?.toLowerCase().includes(query);
    return matchesTitle || matchesSkills || matchesDesc;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      {/* Executive subtle background mesh vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">Career Portal</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                Official Requisitions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="/login" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all"
            >
              <span>Recruiter Access</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Formal Heading Section */}
      <section className="relative z-10 pt-12 pb-8 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Talent Intake</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Career Portal
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Review our open corporate positions below and submit your application directly to our talent acquisition team.
        </p>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Search & Filter Toolbar */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search positions by role title, technology, or required competencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
            />
          </div>
          <div className="text-xs text-slate-400 self-center sm:self-auto whitespace-nowrap font-medium px-2">
            Showing <strong className="text-white font-mono">{filteredJobs.length}</strong> of <span className="font-mono">{jobs.length}</span> active {jobs.length === 1 ? 'opening' : 'openings'}
          </div>
        </div>

        {/* Global Status / Alert Banner */}
        {message && !receipt && (
          <div role="status" className={`mb-8 p-4 rounded-xl border text-sm flex items-start gap-3 ${
            isDuplicate 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDuplicate ? 'text-amber-400' : 'text-red-400'}`} />
            <div className="flex-1">
              {isDuplicate && (
                <div className="font-bold text-amber-200 mb-0.5">Application Already Received for this Requisition</div>
              )}
              <div>{message}</div>
              {isDuplicate && (
                <p className="mt-2 text-xs text-amber-400/90 font-medium">
                  Candidate policy: You may submit an application for other open roles below, but duplicate applications to the same active role are restricted.
                </p>
              )}
            </div>
            <button onClick={() => { setMessage(''); setIsDuplicate(false); }} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Application Successful Modal / Receipt Card */}
        {receipt && (
          <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-slate-900 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-2">
                  Application Confirmed
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Application Received Successfully!
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Thank you for applying. Your resume has been securely received for <strong className="text-white">{selected?.title || 'this position'}</strong>.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setReceipt(null);
                      setSelected(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition-colors"
                  >
                    Browse Other Open Roles
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Job Application Form */}
        {selected && !receipt && (
          <section 
            ref={applyFormRef} 
            className="mb-12 rounded-2xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl relative"
            aria-labelledby="apply-heading"
          >
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Submitting Application
                </span>
                <h2 id="apply-heading" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {selected.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Full-Time</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Engineering</span>
                  <span className="text-slate-500">&bull;</span>
                  <span>Required Skills: {selected.requiredSkills}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Cancel application"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      maxLength={255}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="email"
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jane.doe@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Resume File Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Resume Document (.PDF or .DOCX, max 10 MB) <span className="text-red-400">*</span>
                </label>

                {!resume ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/60'
                    }`}
                    onClick={() => document.getElementById('resume-file-input')?.click()}
                  >
                    <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                    <div className="text-sm font-medium text-slate-200">
                      Drag and drop your resume here, or <span className="text-indigo-400 underline">browse files</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Supports PDF (.pdf) and Microsoft Word (.docx) up to 10 MB
                    </div>
                    <input
                      id="resume-file-input"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndSetFile(file);
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{resume.name}</div>
                        <div className="text-xs text-slate-400">{formatFileSize(resume.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResume(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Notice:</strong> Your application details and resume will be securely reviewed by our hiring team for this requisition.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !resume}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Requisitions List */}
        {jobs.length === 0 ? (
          <div className="text-center py-20 border border-slate-800/60 rounded-2xl bg-slate-900/40">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Open Requisitions Right Now</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Our engineering team publishes new roles regularly. Please check back shortly or reach out to our recruiting team.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 border border-slate-800/60 rounded-2xl bg-slate-900/40">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No roles match &quot;{searchQuery}&quot;</h3>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or searching for broader terms like &quot;React&quot; or &quot;Java&quot;.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const skillsArray = job.requiredSkills
                ? job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
                : [];
              const isJobSelected = selected?.id === job.id;

              return (
                <article
                  key={job.id}
                  className={`p-6 sm:p-8 rounded-2xl transition-all duration-200 border ${
                    isJobSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {job.status === 'UNPUBLISHED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                            Intake Concluded
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active Requisition</span>
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700/60 text-slate-300">
                          Full-Time
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {job.title}
                      </h2>

                      <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>

                      {skillsArray.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                            Key Competencies
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {skillsArray.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="sm:self-start flex-shrink-0 pt-2 sm:pt-0">
                      {job.status === 'UNPUBLISHED' ? (
                        <button
                          disabled
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
                        >
                          <span>Intake Concluded</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectJob(job)}
                          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all ${
                            isJobSelected
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950'
                          }`}
                        >
                          <span>{isJobSelected ? 'Selected for Application' : 'Apply for Position'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
