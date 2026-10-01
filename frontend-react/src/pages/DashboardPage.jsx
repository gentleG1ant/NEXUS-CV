import { useState, useEffect } from 'react';
import { processResumes, listJobs, listCandidates, updateCandidateStage, candidateHistory, createJob, publishJob, downloadResume } from '../services/api';

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

export default function DashboardPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [savedCandidates, setSavedCandidates] = useState([]);
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => { listJobs().then(setJobs).catch(() => setErrorMessage('Could not load saved jobs.')); }, []);

  const openJob = async (id) => {
    try { setActiveJob(id); setSavedCandidates(await listCandidates(id)); setErrorMessage(''); }
    catch { setErrorMessage('Could not load candidates.'); }
  };

  const reviewCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    if (candidate.candidateId) {
      try { setHistory(await candidateHistory(candidate.candidateId)); }
      catch { setHistory([]); }
    }
  };

  const changeStage = async (stage) => {
    const reason = window.prompt(`Reason for moving candidate to ${stage}:`);
    if (!reason?.trim()) return;
    try {
      await updateCandidateStage(selectedCandidate.candidateId, stage, reason.trim());
      if (activeJob) await openJob(activeJob);
      setSelectedCandidate(null);
      setErrorMessage('');
    } catch { setErrorMessage('Could not save the review decision.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    setSelectedTemplate(templateName);
    
    if (templateName === 'custom') {
      setJobTitle('');
      setRequiredSkills('');
      setJobDescription('');
    } else {
      const tpl = JOB_TEMPLATES[templateName];
      setJobTitle(tpl.title);
      setRequiredSkills(tpl.skills);
      setJobDescription(tpl.description);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert('Please upload at least one resume.');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('title', jobTitle);
    formData.append('description', jobDescription);
    formData.append('requiredSkills', requiredSkills);
    Array.from(files).forEach(file => formData.append('files', file));

    try {
      const response = await processResumes(formData);
      setResults(response);
      setJobs(await listJobs());
      await openJob(response.jobId);
    } catch (error) {
      alert('Error processing resumes. Check if servers are running.');
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!jobTitle.trim() || !jobDescription.trim() || !requiredSkills.trim()) {
      setErrorMessage('Add a title, description and required skills first.'); return;
    }
    try {
      const saved = await createJob({ title: jobTitle, description: jobDescription, requiredSkills, preferredSkills: '' });
      setJobs(await listJobs()); await openJob(saved.id);
      setSuccessMessage(`Draft job #${saved.id} saved. Publish it when ready.`); setErrorMessage('');
    } catch { setErrorMessage('Could not save the draft job.'); }
  };

  const publishSelected = async () => {
    try {
      await publishJob(activeJob); setJobs(await listJobs());
      setSuccessMessage('Job published on the local careers page.'); setErrorMessage('');
    } catch { setErrorMessage('Could not publish the job.'); }
  };

  const getResume = async (candidate) => {
    try {
      const blob = await downloadResume(candidate.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = `resume-${candidate.id}`; link.click(); URL.revokeObjectURL(url);
    } catch { setErrorMessage('Could not download the resume.'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          <h1 className="text-2xl font-bold tracking-wide">AI Gateway</h1>
        </div>
        <div>
          <span className="mr-4 text-blue-100">Welcome, {localStorage.getItem('user')}</span>
          <button onClick={handleLogout} className="bg-blue-800 px-4 py-2 rounded font-semibold hover:bg-blue-900 transition-colors">Logout</button>
        </div>
      </nav>

      {errorMessage && <p role="alert" className="container mx-auto px-6 pt-4 text-red-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="container mx-auto px-6 pt-4 text-green-800">{successMessage}</p>}
      <main className="container mx-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Job Form */}
        <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">New Screening Job</h2>
          
          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <label className="block text-blue-800 text-sm font-bold mb-1">Quick Templates</label>
            <select 
              value={selectedTemplate} 
              onChange={handleTemplateChange}
              className="w-full border-blue-200 p-2 rounded bg-white focus:ring-2 focus:ring-blue-400 outline-none text-sm text-gray-700"
            >
              <option value="custom">-- Create Custom Job --</option>
              {Object.keys(JOB_TEMPLATES).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Job Title</label>
              <input type="text" placeholder="e.g. Senior Software Engineer" className="w-full border p-2.5 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Required Skills (comma separated)</label>
              <input type="text" placeholder="e.g. Java, Python, React" className="w-full border p-2.5 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Job Description</label>
              <textarea placeholder="Paste full job description here..." className="w-full border p-2.5 rounded h-32 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={jobDescription} onChange={e => setJobDescription(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">Upload Resumes (PDF/DOCX)</label>
              <input type="file" multiple accept=".pdf,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => setFiles(e.target.files)} required />
            </div>
            <button type="button" onClick={saveDraft} className="w-full border border-blue-700 text-blue-700 p-3 rounded-lg font-bold">Save job draft without resumes</button>
            <button type="submit" disabled={loading} className={`w-full text-white p-3 rounded-lg font-bold transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? '🤖 AI is analyzing resumes...' : 'Screen Candidates'}
            </button>
          </form>
        </div>

        {/* Right Column: Results List */}
        <div className="lg:w-2/3">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-bold mb-3">Saved jobs and reviews</h2>
            <label className="block text-sm mb-2" htmlFor="saved-job">Select a job</label>
            <select id="saved-job" className="border rounded p-2 w-full" value={activeJob || ''}
              onChange={e => e.target.value && openJob(Number(e.target.value))}>
              <option value="">Choose a saved job</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{job.title} (#{job.id})</option>)}
            </select>
            {activeJob && <div className="flex items-center gap-4 mt-3">
              <button onClick={publishSelected} className="bg-green-700 text-white rounded px-4 py-2">Publish job</button>
              <a href="/careers" className="text-blue-700 underline">View careers page</a>
            </div>}
            {activeJob && <div className="mt-4 space-y-2">{savedCandidates.map(candidate =>
              <div key={candidate.id} className="border rounded p-3 flex justify-between gap-3 items-center">
                <div><strong>{candidate.name}</strong><p className="text-sm text-gray-600">{candidate.email || candidate.source || 'Recruiter import'} · {candidate.stage} · {candidate.matchScore == null ? 'Needs manual review' : `Match ${(candidate.matchScore * 100).toFixed(1)}%`}</p>
                  <p className="text-sm">{candidate.matchExplanation}</p></div>
                <div className="flex gap-2">{candidate.resumeAvailable && <button className="border rounded px-3 py-2" onClick={() => getResume(candidate)}>Resume</button>}
                <button className="bg-blue-700 text-white rounded px-3 py-2" onClick={() => reviewCandidate({
                  candidateId: candidate.id, filename: candidate.name, final_score: candidate.matchScore || 0,
                  recruiter_explanation: candidate.matchExplanation, stage: candidate.stage,
                  strengths: [], skill_gaps: [], top_matching_terms: [], rank_position: '—',
                  skills_required_score: 0, experience_score: 0, education_score: 0, global_context_score: 0
                })}>Review</button></div>
              </div>)}</div>}
          </section>
          {results ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ranked Pipeline</h2>
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">Processed: {results.processed_count}</span>
              </div>
              
              <div className="space-y-4">
                {results.rankings.map((candidate, idx) => (
                  <div key={idx} onClick={() => reviewCandidate(candidate)} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-2 relative hover:shadow-md cursor-pointer transition-shadow bg-white hover:border-blue-300">
                    <div className="absolute top-5 right-5 bg-blue-100 text-blue-800 font-bold px-4 py-1 rounded-full text-lg">
                      #{candidate.rank_position}
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 w-3/4 truncate">{candidate.filename}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">Score: {(candidate.final_score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{candidate.recruiter_explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-[400px]">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <p className="text-lg">Waiting for resumes...</p>
            </div>
          )}
        </div>
      </main>

      {/* Detailed Candidate Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setSelectedCandidate(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h2 className="text-2xl font-bold mb-1 pr-8">{selectedCandidate.filename}</h2>
            <div className="flex gap-3 mb-6 border-b pb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-bold">Rank #{selectedCandidate.rank_position}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded font-mono">Final Score: {(selectedCandidate.final_score * 100).toFixed(1)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {selectedCandidate.rank_position !== '—' && <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sub-Scores</h4>
                <ul className="text-sm space-y-2">
                  <li className="flex justify-between"><span>Required Skills:</span> <span className="font-mono">{(selectedCandidate.skills_required_score * 100).toFixed(0)}%</span></li>
                  <li className="flex justify-between"><span>Experience:</span> <span className="font-mono">{(selectedCandidate.experience_score * 100).toFixed(0)}%</span></li>
                  <li className="flex justify-between"><span>Education:</span> <span className="font-mono">{(selectedCandidate.education_score * 100).toFixed(0)}%</span></li>
                  <li className="flex justify-between"><span>Context:</span> <span className="font-mono">{(selectedCandidate.global_context_score * 100).toFixed(0)}%</span></li>
                </ul>
              </div>}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Top Matching Terms</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedCandidate.top_matching_terms.map((term, i) => (
                    <span key={i} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{term}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-bold text-green-700 mb-1">Detected Strengths</h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-green-50 p-3 rounded">{selectedCandidate.strengths.join(', ')}</p>
            </div>
            
            {selectedCandidate.skill_gaps.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-red-700 mb-1">Missing / Skill Gaps</h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-red-50 p-3 rounded">{selectedCandidate.skill_gaps.join(', ')}</p>
              </div>
            )}

            <div className="mb-8">
              <h4 className="text-sm font-bold text-gray-700 mb-1">Match explanation — review the resume yourself</h4>
              <p className="text-sm text-gray-700 italic border-l-4 border-blue-500 pl-3">{selectedCandidate.recruiter_explanation}</p>
            </div>

            {history.length > 0 && <div className="mb-6"><h4 className="font-bold mb-2">Review history</h4>
              {history.map((event, i) => <p key={i} className="text-sm border-b py-2">{event.fromStage} → {event.toStage} by {event.actor}: {event.reason}</p>)}
            </div>}

            <div className="flex gap-4 justify-end border-t pt-4">
              <button className="px-6 py-2 border-2 border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors" onClick={() => changeStage('REJECTED')}>Reject with reason</button>
              <button className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors" onClick={() => changeStage('INTERVIEW')}>Move to Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
