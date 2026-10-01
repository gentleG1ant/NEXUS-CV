import { useEffect, useState } from 'react';
import { publicJobs, applyForJob } from '../services/api';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicJobs().then(setJobs).catch(() => setMessage('Could not load open jobs. Please try again later.'));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!selected || !resume) return;
    setLoading(true);
    setMessage('');
    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('resume', resume);
    try {
      const receipt = await applyForJob(selected.id, form);
      setMessage(`Application received. Your reference is #${receipt.applicationId}.`);
      setName(''); setEmail(''); setResume(null); setSelected(null);
      event.target.reset();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Your application could not be submitted. Check the resume and try again.');
    } finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <header className="flex items-center justify-between gap-4 mb-10">
        <h1 className="text-2xl font-bold">Open roles</h1>
        <a href="/login" className="text-blue-700 underline">Recruiter sign in</a>
      </header>
      {message && <p role="status" className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded">{message}</p>}
      {jobs.length === 0 && <p>No roles are open right now.</p>}
      <div className="space-y-5">{jobs.map(job => <article key={job.id} className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold">{job.title}</h2>
        <p className="mt-3 whitespace-pre-wrap">{job.description}</p>
        <p className="mt-3 text-sm"><strong>Required skills:</strong> {job.requiredSkills}</p>
        <button onClick={() => { setSelected(job); setMessage(''); }} className="mt-5 bg-blue-700 text-white rounded px-5 py-2">Apply</button>
      </article>)}</div>
      {selected && <section className="bg-white border rounded-xl p-6 mt-8" aria-labelledby="apply-title">
        <h2 id="apply-title" className="text-xl font-semibold mb-4">Apply for {selected.title}</h2>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">Full name<input required maxLength="255" value={name} onChange={e => setName(e.target.value)} className="block w-full border rounded p-2 mt-1" /></label>
          <label className="block">Email<input required type="email" maxLength="255" value={email} onChange={e => setEmail(e.target.value)} className="block w-full border rounded p-2 mt-1" /></label>
          <label className="block">Resume (PDF or DOCX, up to 10 MB)<input required type="file" accept=".pdf,.docx" onChange={e => setResume(e.target.files?.[0] || null)} className="block w-full mt-1" /></label>
          <p className="text-sm text-slate-600">The recruiter will review your application. A resume match score does not decide the outcome.</p>
          <div className="flex gap-3"><button disabled={loading} type="submit" className="bg-blue-700 text-white rounded px-5 py-2 disabled:opacity-50">{loading ? 'Submitting…' : 'Submit application'}</button>
            <button type="button" onClick={() => setSelected(null)} className="border rounded px-5 py-2">Cancel</button></div>
        </form>
      </section>}
    </div>
  </main>;
}
