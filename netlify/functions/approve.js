const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) return { statusCode: 400, body: 'Missing ID' };

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data: summary, error } = await sb
    .from('summaries')
    .select('*, tutors(name), students(name, parent_email, parent_name)')
    .eq('id', id)
    .single();

  if (error || !summary) return { statusCode: 404, body: 'Summary not found' };
  if (summary.status === 'sent') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body style="font-family:sans-serif;text-align:center;padding:3rem"><h2>Already sent!</h2><p>This summary was already approved and sent to the parent.</p></body></html>'
    };
  }

  const studentName = summary.students ? summary.students.name : 'Student';
  const parentName = summary.students ? (summary.students.parent_name || 'Parent') : 'Parent';
  const tutorName = summary.tutors ? summary.tutors.name : 'Tutor';
  const parentEmail = summary.students ? summary.students.parent_email : '';
  const d = summary.session_date ? new Date(summary.session_date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  await resend.emails.send({
    from: 'Scholars Elite Tuition <contact@scholarselite.com.au>',
    to: parentEmail,
    subject: `Session Summary for ${studentName} — ${d}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem">
        <h2 style="color:#0f1b2d">Hey ${parentName},</h2>
        <p>Please find below the session summary for <strong>${studentName}</strong> on ${d}, conducted by ${tutorName}.</p>
        <hr style="border:none;border-top:1px solid #dde4ec;margin:1.5rem 0"/>
        <h3 style="color:#0f1b2d">Topics Covered</h3>
        <p>${summary.topics}</p>
        <h3 style="color:#0f1b2d">Student Progress</h3>
        <p>${summary.progress}</p>
        ${summary.homework ? `<h3 style="color:#0f1b2d">Homework Assigned</h3><p>${summary.homework}</p>` : ''}
        <hr style="border:none;border-top:1px solid #dde4ec;margin:1.5rem 0"/>
        <p style="color:#7a93ab;font-size:13px">Warm regards,<br><strong>Scholars Elite Tuition</strong><br>contact@scholarselite.com.au</p>
      </div>
    `
  });

  await sb.from('summaries').update({ status: 'sent' }).eq('id', id);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `<html><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#faf8f4"><div style="max-width:400px;margin:0 auto;background:white;border-radius:18px;padding:2.5rem;border:1px solid #dde4ec"><h2 style="color:#0f1b2d">Email sent!</h2><p style="color:#7a93ab">The session summary for <strong>${studentName}</strong> has been sent to the parent successfully.</p></div></body></html>`
  };
};
