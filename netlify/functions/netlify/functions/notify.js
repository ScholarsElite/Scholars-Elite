const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const { id, studentName, tutorName, sessionDate, topics, progress, homework, siteUrl } = JSON.parse(event.body);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const approveUrl = `${siteUrl}/.netlify/functions/approve?id=${id}`;

  await resend.emails.send({
    from: 'Scholars Elite Tuition <contact@scholarselite.com.au>',
    to: process.env.OWNER_EMAIL,
    subject: `New summary to review — ${studentName} (${sessionDate})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem">
        <h2 style="color:#0f1b2d">New session summary submitted</h2>
        <p><strong>${tutorName}</strong> has submitted a summary for <strong>${studentName}</strong> on ${sessionDate}.</p>
        <hr style="border:none;border-top:1px solid #dde4ec;margin:1.5rem 0"/>
        <h3 style="color:#0f1b2d">Topics Covered</h3>
        <p>${topics}</p>
        <h3 style="color:#0f1b2d">Student Progress</h3>
        <p>${progress}</p>
        ${homework ? `<h3 style="color:#0f1b2d">Homework Assigned</h3><p>${homework}</p>` : ''}
        <hr style="border:none;border-top:1px solid #dde4ec;margin:1.5rem 0"/>
        <div style="text-align:center;margin:2rem 0">
          <a href="${approveUrl}" style="background:#0f1b2d;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px">Approve &amp; Send to Parent →</a>
        </div>
        <p style="color:#7a93ab;font-size:12px;text-align:center">Tapping this button will instantly send the summary to the parent.</p>
      </div>
    `
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
