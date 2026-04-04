
var SUPABASE_URL='https://ikmzwhlexgqucjlrlqwq.supabase.co';
var SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbXp3aGxleGdxdWNqbHJscXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDE3NzksImV4cCI6MjA5MDc3Nzc3OX0.jIH3H-q7zILJRg33FNQe3Dx9Ua8CfAUbXX4G-wOWE7Q';
var currentTutor=null;
var sb=null;

sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

function switchTab(tab,btn){
  document.querySelectorAll('.tab').forEach(function(el){el.classList.remove('active');});
  btn.classList.add('active');
  if(tab==='tutor'){if(currentTutor)showView('view-tutor-form');else showView('view-tutor-login');}
  else showView('view-owner-info');
}
function showView(id){
  document.querySelectorAll('.view').forEach(function(el){el.classList.remove('active');});
  document.getElementById(id).classList.add('active');
}

async function tutorLogin(){
  console.log('tutorLogin called');
  var email=document.getElementById('login-email').value.trim().toLowerCase();
  var errEl=document.getElementById('login-error');
  var btn=document.getElementById('login-btn');
  errEl.classList.remove('show');
  if(!email){errEl.textContent='Please enter your email.';errEl.classList.add('show');return;}
  console.log('sb value:', sb);
  if(!sb){
    errEl.textContent='Connection error. Please refresh the page and try again.';
    errEl.classList.add('show');
    console.error('Supabase not initialised');
    return;
  }
  btn.disabled=true;btn.textContent='Checking...';
  try{
    console.log('Querying Supabase for:', email);
    var res=await sb.from('tutors').select('*').ilike('email',email);
    console.log('Supabase response:', res);
    if(res.error)throw new Error(res.error.message);
    if(!res.data||res.data.length===0){
      errEl.textContent='No tutor found with that email. Please check and try again.';
      errEl.classList.add('show');
      btn.disabled=false;btn.textContent='Continue →';
      return;
    }
    currentTutor=res.data[0];
    document.getElementById('tutor-display-name').textContent=currentTutor.name;
    await loadStudentsForTutor(currentTutor.id);
    document.getElementById('f-date').value=new Date().toISOString().split('T')[0];
    showView('view-tutor-form');
  }catch(e){
    console.error('Login error:', e);
    errEl.textContent='Error: '+e.message;
    errEl.classList.add('show');
  }
  btn.disabled=false;btn.textContent='Continue →';
}

function tutorLogout(){
  currentTutor=null;
  document.getElementById('login-email').value='';
  showView('view-tutor-login');
}

async function loadStudentsForTutor(tutorId){
  var res=await sb.from('tutor_students').select('student_id,students(id,name)').eq('tutor_id',tutorId);
  var sel=document.getElementById('f-student');
  sel.innerHTML='<option value="">Select student...</option>';
  if(res.data&&res.data.length){
    res.data.forEach(function(row){
      if(row.students){
        var o=document.createElement('option');
        o.value=row.students.id;
        o.textContent=row.students.name;
        sel.appendChild(o);
      }
    });
  }
}

async function submitSummary(){
  var studentId=document.getElementById('f-student').value;
  var date=document.getElementById('f-date').value;
  var topics=document.getElementById('f-topics').value.trim();
  var progress=document.getElementById('f-progress').value.trim();
  var homework=document.getElementById('f-homework').value.trim();
  if(!studentId||!date||!topics||!progress){showToast('Please fill in all required fields');return;}
  var btn=document.getElementById('submit-btn');
  btn.disabled=true;btn.textContent='Submitting...';
  try{
    var res=await sb.from('summaries').insert({
      tutor_id:currentTutor.id,
      student_id:studentId,
      session_date:date,
      topics:topics,
      progress:progress,
      homework:homework,
      status:'pending'
    }).select('*,tutors(name),students(name,parent_email,parent_name)').single();
    if(res.error)throw new Error(res.error.message);
    var summary=res.data;
    var studentName=summary.students?summary.students.name:'Student';
    var tutorName=summary.tutors?summary.tutors.name:currentTutor.name;
    var d=new Date(date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
    await fetch('/.netlify/functions/notify',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        id:summary.id,
        studentName:studentName,
        tutorName:tutorName,
        sessionDate:d,
        topics:topics,
        progress:progress,
        homework:homework,
        siteUrl:window.location.origin
      })
    });
    document.getElementById('f-student').value='';
    document.getElementById('f-topics').value='';
    document.getElementById('f-progress').value='';
    document.getElementById('f-homework').value='';
    var bar=document.getElementById('success-bar');
    bar.classList.add('show');
    setTimeout(function(){bar.classList.remove('show');},6000);
    showToast('Summary submitted!');
  }catch(e){showToast('Error: '+e.message);}
  btn.disabled=false;btn.text
