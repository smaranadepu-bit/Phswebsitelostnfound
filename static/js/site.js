/* Simple SPA storing data in localStorage for Live Server/demo use.
   - Items stored under key 'lf_items' as array
   - Claims stored inside each item.claims array
   - Images saved as data URLs (base64)
   - Admin password is 'secret' for demo only
*/

const ADMIN_PASS = 'secret';
const STORAGE_KEY = 'lf_items_v1';
const LOST_REPORTS_KEY = 'lf_lost_reports_v1';
const ADMIN_MESSAGES_KEY = 'lf_admin_messages_v1';
const SCHOOL_NAME = 'Pensacola High School';

// ===============================
// Utilities & storage helpers
// ===============================

// runtime handlers for auth modal
window._authModalKeyHandler = null;

function now() { return new Date().toISOString(); }

function loadItems(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e){ return []; }
}

// ===============================
// Help page: Testimonials, FAQ, and admin messaging
// ===============================
function renderHelp(){ setTitle('Help & FAQ - ' + SCHOOL_NAME);
  app.innerHTML = `
    <section class="hero small" aria-label="Help Hero">
      <div class="hero-content">
        <h1>Help & Support</h1>
        <p class="hero-quote">Find answers, read reviews, and learn how to claim items.</p>
      </div>
    </section>
    <section class="testimonials" aria-label="Testimonials">
      <h2 class="help-section-title">What people say</h2>
      <div class="testimonial-card"><strong>"Fantastic service — found my laptop in a day."</strong><div class="muted">— Student, Junior</div></div>
      <div class="testimonial-card"><strong>"Staff were so helpful with coordinating pickup."</strong><div class="muted">— Teacher, Ms. Ortiz</div></div>
      <div class="testimonial-card"><strong>"Easy to use and fast approvals."</strong><div class="muted">— Parent</div></div>
    </section>

    <section class="faq" aria-label="FAQ">
      <h2 class="help-section-title">Frequently Asked Questions</h2>
      <div class="faq-item"><div class="q"><span>How do I claim an item?</span><span>+</span></div><div class="a">Submit a claim on the item page and an admin will contact you to confirm ownership.</div></div>
      <div class="faq-item"><div class="q"><span>Where can I pick up items?</span><span>+</span></div><div class="a">Claims are processed at the main office during school hours unless otherwise arranged. Bring a photo ID.</div></div>
      <div class="faq-item"><div class="q"><span>Can I report items anonymously?</span><span>+</span></div><div class="a">Yes — you can skip your email, but providing contact details helps the owner.</div></div>
    </section>

    <section class="policy" aria-label="Pickup Policy">
      <h2 class="help-section-title">Pickup & Contact Policy</h2>
      <p class="muted help-policy-text">All found items are held in the main office. Please present ID and be prepared to describe the item when claiming. If you are a staff member coordinating pickup, contact the office to schedule a time.</p>
    </section>

    <section class="quick-links" aria-label="Quick links">
      <a class="btn" href="#/submit">Report an item</a>
      <a class="btn secondary" href="#/lost">Search found items</a>
      <a class="btn-ghost" href="#/">Back to Home</a>
    </section>
    <section class="contact-info" style="margin-top:34px;padding:28px 18px;border-radius:12px;">
      <h3 class="help-section-title">Message an Admin</h3>
      <form id="adminMessageForm" class="pro-form" style="max-width:720px;margin:0 auto">
        <label class="input-label" for="am_name">Your name</label>
        <input id="am_name" class="field" type="text" placeholder="Your full name" required>
        <label class="input-label" for="am_email">Your email</label>
        <input id="am_email" class="field" type="email" placeholder="you@example.com" required>
        <label class="input-label" for="am_message">Message</label>
        <textarea id="am_message" class="field" rows="4" placeholder="How can we help?" required></textarea>
        <div style="display:flex;justify-content:flex-end">
          <button class="btn" type="submit">Send message</button>
        </div>
      </form>
    </section>
  `;

  // FAQ toggle behavior
  document.querySelectorAll('.faq-item').forEach(fi=>{
    const q = fi.querySelector('.q'); if(q) q.addEventListener('click', ()=> fi.classList.toggle('open'));
  });
  // Admin message form
  const msgForm = document.getElementById('adminMessageForm');
  if(msgForm){
    msgForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = (document.getElementById('am_name').value || '').trim();
      const email = (document.getElementById('am_email').value || '').trim();
      const message = (document.getElementById('am_message').value || '').trim();
      if(!name || !email || !message){ alert('Please complete all fields.'); return; }
      const msgs = loadAdminMessages();
      msgs.push({ id: 'm'+Date.now(), name, email, message, created_at: now() });
      saveAdminMessages(msgs);
      msgForm.reset();
      alert('Message sent — an admin will review it soon.');
    });
  }
  initEnhancements();
}
function saveItems(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function loadLostReports(){ try{ return JSON.parse(localStorage.getItem(LOST_REPORTS_KEY)||'[]'); }catch(e){return [];} }
function saveLostReports(r){ localStorage.setItem(LOST_REPORTS_KEY, JSON.stringify(r)); }
function loadAdminMessages(){ try{ return JSON.parse(localStorage.getItem(ADMIN_MESSAGES_KEY)||'[]'); }catch(e){return [];} }
function saveAdminMessages(m){ localStorage.setItem(ADMIN_MESSAGES_KEY, JSON.stringify(m)); }
function addItem(item){ const items = loadItems(); items.push(item); saveItems(items); try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){} return item; }
function getItem(id){ return loadItems().find(x=>x.id===id); }
function updateItem(updated){ const items = loadItems(); const i = items.findIndex(x=>x.id===updated.id); if(i>=0){ items[i]=updated; saveItems(items); } }
function deleteItem(id){ let items = loadItems(); items = items.filter(x=>x.id!==id); saveItems(items); }

function toId(){ return 'i'+Date.now()+Math.floor(Math.random()*1000); }

// --- Users & Admins (localStorage-backed, password hashed via Web Crypto) ---
const USERS_KEY = 'lf_users_v1';
const ADMINS_KEY = 'lf_admins_v1';
// Admin sign-up requires a school-provided static code for demo purposes.
// Replace this with your school's single admin signup code.
const ADMIN_SIGNUP_CODE = 'FBLA123';

function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); }catch(e){return [];} }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function loadAdmins(){ try{ return JSON.parse(localStorage.getItem(ADMINS_KEY)||'[]'); }catch(e){return [];} }
function saveAdmins(a){ localStorage.setItem(ADMINS_KEY, JSON.stringify(a)); }

async function hashPassword(p){
  if(!p) return '';
  const enc = new TextEncoder().encode(p);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function addUserRecord(u){ const users = loadUsers(); users.push(u); saveUsers(users); }
function addAdminRecord(a){ const admins = loadAdmins(); admins.push(a); saveAdmins(admins); }

async function ensureDemoAdmin(){
  const admins = loadAdmins();
  if(admins.length===0){
    const pass = await hashPassword('secret');
    addAdminRecord({ id: 'a'+Date.now(), name: 'Site Admin', email: 'admin@pensacolahs.edu', passwordHash: pass, created_at: now() });
  }
}
// seed demo admin if needed
ensureDemoAdmin().catch(()=>{});

// UI helpers
const app = document.getElementById('app');
// keep a copy of the server-rendered/static home markup so we can restore it
let _staticHomeHTML = null;
function setTitle(t){ document.title = t; }

// Set the school's background image (choose from provided assets). Uses one of the supplied images so every page shows school imagery.
function setSchoolBackground(){
  try{
    const imgs = ['static/assets/pensacola_img.jpg','static/assets/phs_front2.jpg'];
    // pick first available image
    const chosen = imgs.find(u=>{ try{ const img = new Image(); img.src = u; return true; }catch(e){ return false; } }) || imgs[0];
    document.body.style.backgroundImage = `url('${chosen}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center center';
    document.body.style.backgroundAttachment = 'fixed';
  }catch(e){ /* ignore */ }
}
// Update the Account link in the header to show user greeting when logged in
function updateAccountNav(){
  try{
    const nav = document.querySelector('header.site-header nav');
    if(!nav) return;
    const topBtn = document.getElementById('authTopBtn');
    // remove existing user menu if any
    const existingMenu = document.querySelector('.user-menu'); if(existingMenu) existingMenu.remove();
    const userLink = nav.querySelector('a[href="#/auth"]');
    const userId = sessionStorage.getItem('lf_user');
    const isAdmin = sessionStorage.getItem('lf_admin')==='1';
    if(userId || isAdmin){
      if(topBtn) topBtn.style.display = 'none';
      const user = loadUsers().find(u=>u.id===userId) || {name:'User'};
      // replace link with greeting button
      if(userLink){
          const btn = document.createElement('button'); btn.className='user-greeting'; btn.textContent = `Hey! ${user.name.split(' ')[0]||user.name}`;
          btn.setAttribute('aria-haspopup','true'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('type','button'); btn.tabIndex = 0;
        userLink.replaceWith(btn);
        // toggle menu
          btn.addEventListener('click', (e)=>{
          e.stopPropagation();
          // if menu exists, remove
          const open = document.querySelector('.user-menu'); if(open){ open.remove(); return; }
          const menu = document.createElement('div'); menu.className='user-menu';
            menu.setAttribute('role','menu'); menu.setAttribute('aria-label','Account menu');
          // Switch account / logout
          const switchBtn = document.createElement('button'); switchBtn.textContent='Switch account'; switchBtn.addEventListener('click', ()=>{ closeAuthModal(); showAuthModal(); menu.remove(); });
          const logoutBtn = document.createElement('button'); logoutBtn.textContent='Log out'; logoutBtn.addEventListener('click', ()=>{ logout(); menu.remove(); });
            // ARIA roles for menu items
            [switchBtn, logoutBtn].forEach(it=>{ it.setAttribute('role','menuitem'); it.tabIndex = -1; });
            menu.appendChild(switchBtn);
          // if admin also logged show dashboard link
            if(isAdmin){ const adminBtn = document.createElement('button'); adminBtn.textContent='Admin Dashboard'; adminBtn.addEventListener('click', ()=>{ menu.remove(); renderAdmin(); }); adminBtn.setAttribute('role','menuitem'); adminBtn.tabIndex = -1; menu.appendChild(adminBtn); }
            menu.appendChild(logoutBtn);
          document.body.appendChild(menu);
          // position menu under header right
          const rect = btn.getBoundingClientRect(); menu.style.right = (window.innerWidth - rect.right + 12) + 'px';
          menu.style.top = (rect.bottom + 8) + 'px';
            // open state
            btn.setAttribute('aria-expanded','true');
            // focus first menu item
            const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
            if(items.length){ items[0].tabIndex = 0; items[0].focus(); }

            // keyboard navigation inside menu
            menu.addEventListener('keydown', (ev)=>{
              const idx = items.indexOf(document.activeElement);
              if(ev.key === 'Escape'){ ev.preventDefault(); menu.remove(); btn.setAttribute('aria-expanded','false'); btn.focus(); }
              else if(ev.key === 'ArrowDown'){ ev.preventDefault(); const next = items[(idx+1)%items.length]; if(next){ next.tabIndex = 0; next.focus(); }}
              else if(ev.key === 'ArrowUp'){ ev.preventDefault(); const prev = items[(idx-1+items.length)%items.length]; if(prev){ prev.tabIndex = 0; prev.focus(); }}
              else if(ev.key === 'Home'){ ev.preventDefault(); items[0].focus(); }
              else if(ev.key === 'End'){ ev.preventDefault(); items[items.length-1].focus(); }
            });
            // ensure clicking an item closes menu and returns focus appropriately
            items.forEach(it=>{ it.addEventListener('click', ()=>{ btn.setAttribute('aria-expanded','false'); btn.focus(); }); });
        });
          // keyboard: open menu via Enter/Space/ArrowDown
          btn.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' ' || ev.key==='Spacebar' || ev.key==='ArrowDown'){ ev.preventDefault(); btn.click(); } });
        // clicking elsewhere removes menu
        document.addEventListener('click', ()=>{ const m=document.querySelector('.user-menu'); if(m) m.remove(); });
      }
    } else {
      if(topBtn) topBtn.style.display = '';
      // Do not recreate an 'Account' link in the nav. Only the top Sign In button opens the auth modal.
      if(userLink){
        userLink.addEventListener('click', e=>{ e.preventDefault(); showAuthModal(); });
      }
    }

    // Dynamically add/remove Admin link in header nav & dropdown based on admin login state
    try{
      const isAdminNow = sessionStorage.getItem('lf_admin')==='1';
      const existingAdmin = nav.querySelector('a[href="#/admin"]');
      // add admin link to header nav if admin logged in
      if(isAdminNow && !existingAdmin){
        const a = document.createElement('a'); a.href = '#/admin'; a.textContent = 'Admin'; a.id = 'navAdminLink'; a.addEventListener('click', e=>{ /* allow normal hash routing */ });
        nav.appendChild(a);
        // also add to dropdown if present
        const dropdown = document.getElementById('navDropdown');
        if(dropdown){ const link = document.createElement('a'); link.href = '#/admin'; link.textContent = 'Admin'; dropdown.appendChild(link); }
      }
      // remove admin link when not admin
      if(!isAdminNow && existingAdmin){ existingAdmin.remove(); const dropdown = document.getElementById('navDropdown'); if(dropdown){ const dd = dropdown.querySelector('a[href="#/admin"]'); if(dd) dd.remove(); } }
      // Add a logout link to the header nav when a user or admin is logged in.
      try{
        const existingLogout = nav.querySelector('a[href="#/logout"], a[href="#/admin-logout"]');
        const shouldBeAdminLogout = isAdminNow;
        const desiredHref = shouldBeAdminLogout ? '#/admin-logout' : '#/logout';
        // remove any logout links that don't match desired href
        if(existingLogout && existingLogout.getAttribute('href') !== desiredHref){ existingLogout.remove(); }
        if((userId || isAdminNow) && !nav.querySelector(`a[href="${desiredHref}"]`)){
          const la = document.createElement('a'); la.href = desiredHref; la.textContent = 'Log out'; la.id = 'navLogoutLink'; nav.appendChild(la);
          const dropdown = document.getElementById('navDropdown');
          if(dropdown){ const dl = document.createElement('a'); dl.href = desiredHref; dl.textContent = 'Log out'; dl.setAttribute('role','menuitem'); dropdown.appendChild(dl); }
        }
        // when logged out, remove any logout links
        if(!userId && !isAdminNow){ const l = nav.querySelector('a[href="#/logout"], a[href="#/admin-logout"]'); if(l) l.remove(); }
      }catch(err){}
    }catch(err){}
  }catch(e){ console.warn('updateAccountNav failed', e); }
}
function renderHome(q=''){
  setTitle('Home - ' + SCHOOL_NAME + ' Lost & Found');
  // Keep the header/nav visible but render an essentially empty home area per user request.
  document.getElementById('year').textContent = new Date().getFullYear();
  // Gather stats from storage
  const items = loadItems() || [];
  const lostReports = loadLostReports() || [];
  const approvedCount = items.filter(it=>it.approved).length;
  const pendingCount = items.filter(it=>!it.approved).length;
  const claimsCount = items.reduce((s,it)=>s + ((it.claims && it.claims.length) || 0), 0);

  app.innerHTML = `
    <section class="hero" aria-label="Hero">
      <div class="hero-content reveal">
        <h1>Find it. Report it. Reunite faster.</h1>
        <p class="hero-quote">Lost something at school? Community-powered Lost &amp; Found reconnects items with owners fast — photos, filters, and instant updates.</p>
        <div class="hero-cta">
          <a class="cta-btn primary float" href="#/report-lost">
            <span class="cta-ic"><img src="static/assets/icon-search.svg" alt=""></span>
            <span class="cta-label">Report a Lost Item</span>
          </a>
          <a class="cta-btn secondary float" href="#/submit">
            <span class="cta-ic"><img src="static/assets/icon-camera.svg" alt=""></span>
            <span class="cta-label">Report Found Item</span>
          </a>
        </div>
            <a class="browse-large-btn" href="#/browse">Browse Lost/Found Items</a>
      </div>
      <div class="hero-visual reveal" aria-hidden="true">
        <div class="visual-card">
          <img src="static/assets/pensacola_img.jpg" alt="Pensacola High School">
        </div>
      </div>
      <img class="hero-blob" src="static/assets/hero-blob.svg" alt="" aria-hidden="true">
    </section>

    <section class="stats reveal" aria-label="Quick stats">
      <div class="stat card">
        <div class="num" data-target="${approvedCount}">0</div>
        <div class="muted">Items Recovered</div>
      </div>
      <div class="stat card">
        <div class="num" data-target="${pendingCount}">0</div>
        <div class="muted">Reports Filed</div>
      </div>
      <div class="stat card">
        <div class="num" data-target="${claimsCount}">0</div>
        <div class="muted">Active Volunteers</div>
      </div>
    </section>

    <section class="features" aria-label="Features">
      <article class="feature-card reveal">
        <div class="feature-ic"><img src="static/assets/icon-search.svg" alt="search" width="38" height="38"></div>
        <h3>Easily Searchable</h3>
        <p class="muted">Find items by category, color, or photo. Quick filters get you results instantly.</p>
      </article>
      <article class="feature-card reveal">
        <div class="feature-ic"><img src="static/assets/icon-camera.svg" alt="camera" width="38" height="38"></div>
        <h3>Photo-first Reports</h3>
        <p class="muted">Upload photos to help others recognize found items at a glance.</p>
      </article>
      <article class="feature-card reveal">
        <div class="feature-ic"><img src="static/assets/icon-bell.svg" alt="notifications" width="38" height="38"></div>
        <h3>Fast Notifications</h3>
        <p class="muted">Get notified when a matching item is reported — speed up reunions.</p>
      </article>
    </section>

    <section class="carousel reveal" aria-label="Gallery">
      <div class="carousel-track">
        <div class="carousel-item card">
          <img src="static/assets/phs_logo.jpg" alt="Community image">
          <div>
            <h4>Community Support</h4>
            <p class="muted">Students and staff help return items every week.</p>
          </div>
        </div>
        <div class="carousel-item card">
          <img src="static/assets/phs_logo.jpg" alt="Example item">
          <div>
            <h4>Secure Handling</h4>
            <p class="muted">Items are logged and stored safely until claimed.</p>
          </div>
        </div>
      </div>
      <!-- arrows removed for swipe navigation -->
      <div class="carousel-dots" aria-hidden="false"></div>
    </section>

    <section class="quick-links reveal" aria-label="Quick links">
      <a class="card" href="#/submit">Report an Item</a>
      <a class="card" href="#/help">How it Works</a>
    </section>

    <section style="margin-top:28px">
      <h3 style="margin:8px 0 6px;color:var(--accent);font-weight:800">Recent Found Items</h3>
      <div id="homeGrid" class="grid" aria-label="Recent found items">
        ${ (items.filter(it=>it.approved).slice().reverse().slice(0,6).map(it=>`
          <article class="card reveal">
            ${it.image?`<img src="${it.image}" alt="Photo of ${escapeHtml(it.title)}">`:''}
            <h2>${escapeHtml(it.title)}</h2>
            <p class="muted">Found: ${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'Date unknown')}</p>
            <p class="small-muted">${escapeHtml((it.description||'').slice(0,120))}</p>
            <p style="margin-top:10px"><button class="btn" data-action="view" data-id="${it.id}">View</button></p>
          </article>
        `).join('') ) || '<div class="card"><p class="muted">No items available yet. Be the first to <a href="#/submit">report</a>.</p></div>' }
      </div>
    </section>
  `;

  // run visual enhancements (home.js handles reveal and counters)
  try{ initEnhancements(); }catch(e){}
  // wire View buttons for items shown on home
  try{
    document.querySelectorAll('#homeGrid button[data-action="view"]').forEach(btn=> btn.addEventListener('click', e=>{
      e.preventDefault(); const id = btn.dataset.id; const it = getItem(id); if(it) showItemDetailModal(it);
    }));
  }catch(err){/*ignore*/}
}

// Animate homepage-specific elements (hero entrance, stats counting)
function animateHome(){
  try{
    if(window.gsap){
      gsap.from('.hero-content h1',{y:30,opacity:0,duration:0.9,stagger:0.04,ease:'expo.out'});
      gsap.from('.hero-quote',{y:14,opacity:0,duration:0.8,delay:0.08,ease:'power2.out'});
      gsap.from('.hero-cta .btn',{y:6,opacity:0,stagger:0.08,duration:0.5,delay:0.12,ease:'back.out(1.05)'});
      gsap.from('.feature-card',{y:22,opacity:0,stagger:0.08,duration:0.68,delay:0.18,ease:'power2.out'});
      gsap.from('.testimonial-card',{y:20,opacity:0,stagger:0.08,duration:0.68,delay:0.26,ease:'power2.out'});
    }
  }catch(e){ }

  // animate stats numbers
  document.querySelectorAll('.stat .num').forEach(el=>{
    const to = parseInt(el.textContent.replace(/[^0-9]/g,'')) || 0;
    el.textContent = '0';
    if(window.gsap && to>0){
      const obj = {val:0};
      gsap.to(obj,{val:to,duration:1.4,roundProps:'val',onUpdate:()=>{ el.textContent = obj.val + (el.textContent.includes('+')?'+':''); }});
    } else { el.textContent = to; }
  });
}

function renderSubmit(){ setTitle('Report Found Item');
  app.innerHTML = `
    <section class="pro-form" aria-labelledby="report-heading">
      <h2 id="report-heading">Report a Found Item — Official Form</h2>
      <p class="muted">Please provide clear details and a photo so owners can be reunited with their belongings quickly.</p>
      <form id="submitForm" class="form" novalidate>
        <div class="form-row">
          <div>
            <label class="input-label">Title<input id="title" class="field" name="title" required aria-required="true" placeholder="e.g. Black backpack with stickers"></label>
          </div>
          <div>
            <label class="input-label">Location<input id="location" class="field" name="location" placeholder="e.g. Gym, Library"></label>
          </div>
        </div>
        <div class="form-row">
          <div class="full">
            <label class="input-label">Description<textarea id="description" class="field" name="description" rows="4" placeholder="Describe distinctive markings, contents, brand..."></textarea></label>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label class="input-label">Found Date<input id="found_date" class="field" type="date" name="found_date"></label>
          </div>
          <div>
            <label class="input-label">Reported By (optional)<input id="reporter" class="field" name="reporter" placeholder="Name or leave blank"></label>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label class="input-label">Contact email (optional)<input id="report_email" class="field" type="email" name="report_email" placeholder="you@example.com"></label>
          </div>
          <div>
            <label class="input-label">Contact phone (optional)<input id="report_phone" class="field" name="report_phone" placeholder="(555) 555-5555"></label>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label class="input-label">Anonymous? <select id="report_anonymous" class="field"><option value="no">No</option><option value="yes">Yes</option></select></label>
          </div>
        </div>
        <div class="form-row">
          <div class="full">
            <label class="input-label">Photo</label>
            <div id="dropzone" class="dropzone" tabindex="0">
              <div class="dz-preview"><div class="dz-icon">📷</div><div class="dz-meta"><strong>Drag & drop</strong> or <button type="button" id="chooseFile" class="btn-ghost">Choose file</button></div></div>
              <input id="image" type="file" accept="image/*" style="display:none">
            </div>
            <div id="previewArea" style="margin-top:10px"></div>
            <div class="progress" aria-hidden="true"><i id="uploadProgress"></i></div>
          </div>
        </div>
        <div class="submit-wrap">
          <button id="submitBtn" class="btn">Submit Report</button>
          <button type="button" id="saveDraft" class="btn-ghost">Save Draft</button>
          <div class="muted" style="margin-left:auto">Submitted items are pending admin approval.</div>
        </div>
      </form>
    </section>
    <div id="successModal" class="success-modal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="success-card">
        <div class="check-anim" id="checkAnim"></div>
        <h3>Report submitted</h3>
        <p class="muted">Thank you — the item is now pending approval. Admins will review and contact claimants.</p>
        <p style="margin-top:14px"><button id="doneBtn" class="btn">Back to Home</button></p>
      </div>
    </div>
  `;

  // restore draft
  try{ const draft = JSON.parse(localStorage.getItem('lf_draft')||'null'); if(draft){ document.getElementById('title').value = draft.title||''; document.getElementById('description').value = draft.description||''; document.getElementById('location').value = draft.location||''; document.getElementById('found_date').value = draft.found_date||''; document.getElementById('reporter').value = draft.reporter||''; document.getElementById('report_email').value = draft.report_email||''; document.getElementById('report_phone').value = draft.report_phone||''; document.getElementById('report_anonymous').value = draft.report_anonymous||'no'; } }catch(e){}

  const imageInput = document.getElementById('image');
  const dropzone = document.getElementById('dropzone');
  const chooseFile = document.getElementById('chooseFile');
  const previewArea = document.getElementById('previewArea');
  const progressBar = document.getElementById('uploadProgress');

  chooseFile.addEventListener('click', ()=> imageInput.click());
  dropzone.addEventListener('click', ()=> imageInput.click());
  dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; });
  dropzone.addEventListener('dragleave', e=>{ dropzone.style.borderColor = ''; });
  dropzone.addEventListener('drop', async e=>{
    e.preventDefault(); dropzone.style.borderColor = '';
    const f = e.dataTransfer.files[0]; if(f) handleFile(f);
  });
  imageInput.addEventListener('change', e=>{ const f = e.target.files[0]; if(f) handleFile(f); });

  async function handleFile(file){
    const p = document.createElement('div'); p.className = 'dz-preview';
    const imgEl = document.createElement('img'); const meta = document.createElement('div'); meta.className='dz-meta'; meta.textContent = `${file.name} · ${Math.round(file.size/1024)} KB`;
    p.appendChild(imgEl); p.appendChild(meta); previewArea.innerHTML=''; previewArea.appendChild(p);
    // resize image to max 1200px and return dataURL
    const dataUrl = await resizeImage(file, 1200, 0.8, progress=>{ progressBar.style.width=progress+'%'; document.getElementById('uploadProgress').style.width = progress+'%'; });
    imgEl.src = dataUrl;
    imageInput.dataset.value = dataUrl;
  }

  document.getElementById('saveDraft').addEventListener('click', ()=>{
    const draft = { title: document.getElementById('title').value, description: document.getElementById('description').value, location: document.getElementById('location').value, found_date: document.getElementById('found_date').value, reporter: document.getElementById('reporter').value, report_email: document.getElementById('report_email').value, report_phone: document.getElementById('report_phone').value, report_anonymous: document.getElementById('report_anonymous').value };
    localStorage.setItem('lf_draft', JSON.stringify(draft));
    alert('Draft saved locally');
  });

  document.getElementById('submitForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    if(!title){ alert('Please add a title'); return; }
    const description = document.getElementById('description').value.trim();
    const location = document.getElementById('location').value.trim();
    const found_date = document.getElementById('found_date').value || null;
    const reporter = document.getElementById('reporter').value.trim() || null;
    const report_email = document.getElementById('report_email').value.trim() || null;
    const report_phone = document.getElementById('report_phone').value.trim() || null;
    const report_anonymous = document.getElementById('report_anonymous').value === 'yes';
    const image = imageInput.dataset.value || null;
    // show progress animation
    document.getElementById('uploadProgress').style.width = '0%';
    const prog = document.querySelector('.progress'); prog.setAttribute('aria-hidden','false');
    // fake upload progress for UX
    await fakeProgress(700);
    const item = { id: toId(), title, description, location, found_date, reporter: report_anonymous?null:reporter, report_contact_email: report_anonymous?null:report_email, report_contact_phone: report_anonymous?null:report_phone, image, approved: false, created_at: now(), claims: [] };
    addItem(item);
    localStorage.removeItem('lf_draft');
    // show success modal and animate check
    const sm = document.getElementById('successModal'); sm.classList.add('open'); sm.setAttribute('aria-hidden','false');
    animateCheck('#checkAnim');
    document.getElementById('doneBtn').addEventListener('click', ()=>{ sm.classList.remove('open'); location.hash='#/'; });
  });

  initEnhancements();
}

function renderItem(id){ const it = getItem(id); if(!it){ app.innerHTML='<p>Item not found.</p>'; return; }
  setTitle(it.title+' - Item');
  app.innerHTML = `
    <article class="item-detail">
      <h1>${escapeHtml(it.title)}</h1>
      ${it.image?`<img src="${it.image}" alt="Photo of ${escapeHtml(it.title)}">`:''}
      <p class="muted">Found: ${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'Date unknown')}</p>
      <p>${escapeHtml(it.description||'')}</p>
    </article>
    <section>
      <h2>Claim or Inquire</h2>
      <form id="claimForm" class="form">
        <label>Your name<input id="c_name" required></label>
        <label>Your email<input id="c_email" type="email" required></label>
        <label>Message<textarea id="c_message"></textarea></label>
        <button type="submit">Send Claim</button>
      </form>
    </section>
    <section>
      <h3>Previous Claims</h3>
      <div id="claimsList">${(it.claims||[]).map(c=>`<div class="claim"><strong>${escapeHtml(c.name)}</strong> (${escapeHtml(c.email)}) • ${escapeHtml(c.created_at)}<p>${escapeHtml(c.message||'')}</p></div>`).join('')}</div>
    </section>
  `;
  document.getElementById('claimForm').addEventListener('submit', e=>{ e.preventDefault(); const name=document.getElementById('c_name').value.trim(); const email=document.getElementById('c_email').value.trim(); const message=document.getElementById('c_message').value.trim(); const claim = { id: 'c'+Date.now(), name, email, message, created_at: now() }; it.claims = it.claims||[]; it.claims.push(claim); updateItem(it); alert('Claim submitted — admin will contact you'); renderItem(id); });
  initEnhancements();
}

// Lost items page: search and claim against approved listings
function renderLost(q=''){
  setTitle('Lost Items - ' + SCHOOL_NAME);
  const items = loadItems().filter(it=>it.approved).filter(it=>{
    if(!q) return true; const s = (it.title+' '+(it.description||'')).toLowerCase(); return s.includes(q.toLowerCase());
  }).reverse();
  app.innerHTML = `
    <section class="hero small" aria-label="Lost Hero">
      <div class="hero-content">
        <h1>Lost items — ${SCHOOL_NAME}</h1>
        <p class="hero-quote">Search recent found listings to see if your missing item has been turned in.</p>
      </div>
    </section>
    <form id="searchLost" class="search" style="margin-top:14px"><input aria-label="Search" id="q_lost" type="search" placeholder="Search lost items by keyword or location" value="${escapeHtml(q)}"><button>Search</button></form>
    <section class="grid" aria-label="Lost listings">
      ${items.length?items.map(it=>`
        <article class="card">
          ${it.image?`<a href="#/item/${it.id}"><img src="${it.image}" alt="Photo of ${escapeHtml(it.title)}"></a>`:''}
          <h2><a href="#/item/${it.id}">${escapeHtml(it.title)}</a></h2>
          <p class="muted">Found: ${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'Date unknown')}</p>
          <p>${escapeHtml((it.description||'').slice(0,160))}</p>
          <p style="margin-top:8px"><button class="btn secondary" onclick="location.hash='#/item/${it.id}'">This is mine / Claim</button></p>
        </article>
      `).join(''):`<div class="card"><p class="muted">No found items listed yet. Try again later or <a href="#/submit">report a found item</a>.</p></div>`}
    </section>
  `;
  document.getElementById('searchLost').addEventListener('submit', e=>{ e.preventDefault(); const qv=document.getElementById('q_lost').value; location.hash = '#/lost?q='+encodeURIComponent(qv); });
  initEnhancements();
}

// Browse items page: list all items with basic search/filter and admin actions
function renderBrowseItems(q=''){
  setTitle('Browse Items - ' + SCHOOL_NAME);
  const itemsAll = loadItems().slice().reverse();
  const qesc = escapeHtml(q||'');

  // Render minimal page shell; search will be moved to header
  app.innerHTML = `
    <div class="browse-panel">
      <h3 style="margin:8px 0 6px;color:var(--brand-primary);font-weight:800">Featured Lost Items</h3>
      <div id="featuredGrid" class="featured-grid" aria-label="Featured lost items"></div>
    </div>
  `;

  // create search form and insert into header under the logo
  try{
    const headerContainer = document.querySelector('.site-header .container');
    // remove any previous header-browse-search
    const prev = headerContainer.querySelector('.header-browse-search'); if(prev) prev.remove();
    const searchHTML = `
      <form id="browseSearch" class="header-browse-search" style="width:100%;margin-top:10px;">
        <div style="display:flex;gap:10px;align-items:center;width:100%">
          <input aria-label="Search" id="q_browse" type="search" placeholder="Search items by keyword, location or reporter" value="${qesc}" style="flex:1;padding:10px 12px;border-radius:12px">
          <input aria-label="Tags" id="q_tags" type="text" placeholder="Tags (comma separated)" style="width:220px;padding:10px 12px;border-radius:12px">
          <button class="btn" style="white-space:nowrap">Search</button>
        </div>
      </form>`;
    headerContainer.insertAdjacentHTML('beforeend', searchHTML);
  }catch(err){console.warn('insert header search err',err)}

  // wire search in header
  document.getElementById('browseSearch').addEventListener('submit', e=>{ e.preventDefault(); const qv=document.getElementById('q_browse').value; location.hash = '#/browse?q='+encodeURIComponent(qv); });
  // ensure filter/sort exist before binding (we removed inline selects)
  const filterEl = document.getElementById('browseFilter'); if(filterEl) filterEl.addEventListener('change', ()=> applyBrowseFilters());
  const sortEl = document.getElementById('browseSort'); if(sortEl) sortEl.addEventListener('change', ()=> applyBrowseFilters());

  function applyBrowseFilters(){
    const qv = document.getElementById('q_browse').value.toLowerCase();
    const tagsRaw = (document.getElementById('q_tags')?.value||'').toLowerCase();
    const tags = tagsRaw.split(/[,\s]+/).filter(Boolean);
    const filter = document.getElementById('browseFilter')?.value || 'all';
    const sort = document.getElementById('browseSort')?.value || 'new';
    let items = loadItems().slice();
    if(filter==='approved') items = items.filter(i=>i.approved);
    else if(filter==='pending') items = items.filter(i=>!i.approved);
    if(qv) items = items.filter(i=> (i.title + ' ' + (i.description||'') + ' ' + (i.location||'') + ' ' + (i.reporter||'')).toLowerCase().includes(qv));
    if(tags.length){ items = items.filter(i=>{
      const hay = (i.title + ' ' + (i.description||'') + ' ' + (i.location||'')).toLowerCase();
      return tags.every(t=> hay.includes(t));
    }); }
    if(sort==='new') items = items.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    else items = items.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at));
    const grid = document.getElementById('featuredGrid');
    grid.innerHTML = items.length? items.map(it=>`<article class="card browse-card reveal">
          <div style="display:flex;gap:12px;align-items:flex-start">
            ${it.image?`<a href="#/item/${it.id}"><img src="${it.image}" alt="Photo of ${escapeHtml(it.title)}" style="width:180px;height:126px;object-fit:cover;border-radius:8px"></a>`:''}
            <div style="flex:1">
              <h2 style="margin:0 0 6px"><a href="#/item/${it.id}">${escapeHtml(it.title)}</a></h2>
              <p class="muted" style="margin:0 0 6px">Found: ${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'Date unknown')}</p>
              <p style="margin:0 0 8px">${escapeHtml((it.description||'').slice(0,220))}</p>
              <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="btn small" data-id="${it.id}" data-action="view">View</button> ${it.approved?'<span class="muted">Approved</span>':'<span style="color:var(--accent)">Pending</span>'}</div>
            </div>
          </div>
        </article>`).join('') : `<div class="card"><p class="muted">No items found.</p></div>`;
    attachFeaturedButtons();
  }

  // expose a tilt helper to be used by multiple sections
  function addTiltGlobal(el){
    try{
      if(!window.gsap) return;
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('pointermove', e=>{
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * 8;
        const ry = (px - 0.5) * -10;
        gsap.to(el, {rotationX: rx, rotationY: ry, duration:0.36, transformPerspective:900, transformOrigin:'center'});
      });
      el.addEventListener('pointerleave', ()=> gsap.to(el, {rotationX:0, rotationY:0, scale:1, duration:0.6, ease:'elastic.out(1,0.6)'}));
      el.addEventListener('pointerdown', ()=> gsap.to(el, {scale:0.985, duration:0.12}));
      el.addEventListener('pointerup', ()=> gsap.to(el, {scale:1, duration:0.2}));
    }catch(e){/* ignore */}
  }

  function animateBrowseUI(){
    // setup focus animations for search
    try{
      const search = document.getElementById('q_browse');
      const tagsInput = document.getElementById('q_tags');
      const btn = document.querySelector('#browseSearch .btn');
      if(window.gsap){
        if(search){
          search.addEventListener('focus', ()=> gsap.to(search,{scale:1.01, duration:0.18}));
          search.addEventListener('blur', ()=> gsap.to(search,{scale:1, duration:0.18}));
        }
        if(tagsInput){
          tagsInput.addEventListener('focus', ()=> gsap.to(tagsInput,{x:0, duration:0.18}));
        }
        if(btn){
          btn.addEventListener('mouseenter', ()=> gsap.to(btn,{y:-4, duration:0.18}));
          btn.addEventListener('mouseleave', ()=> gsap.to(btn,{y:0, duration:0.18}));
        }
      }

      // reveal items with stagger
      const cards = Array.from(document.querySelectorAll('#featuredGrid .card'));
      if(window.gsap && cards.length){
        gsap.killTweensOf(cards);
        gsap.fromTo(cards,
          {opacity:0,y:12,scale:0.996},
          {opacity:1,y:0,scale:1,duration:0.6,stagger:0.06,ease:'power3.out'});
      } else {
        cards.forEach((c,i)=> setTimeout(()=> c.classList.add('show'), i*60));
      }

      // attach tilt interactions to the browse result cards
      try{ Array.from(document.querySelectorAll('#featuredGrid .card')).forEach(c => addTiltGlobal(c)); }catch(e){}

      // quick tag helper: when user types tags and presses comma, create chip in hint area
      const hint = document.querySelector('.search-hint');
      if(hint && tagsInput){
        tagsInput.addEventListener('keyup', (e)=>{
          if(e.key===','){
            const tokens = tagsInput.value.split(/[,\s]+/).filter(Boolean);
            renderTagHints(tokens.slice(-3));
          }
        });
      }
    }catch(err){console.warn('animateBrowseUI err',err)}
  }

  function renderTagHints(tags){
    let hint = document.querySelector('.search-hint');
    if(!hint){
      const form = document.getElementById('browseSearch');
      hint = document.createElement('div'); hint.className='search-hint'; form.appendChild(hint);
    }
    hint.innerHTML = tags.map(t=>`<span class="chip">${escapeHtml(t)}</span>`).join(' ');
  }

  function attachBrowseButtons(){
    document.querySelectorAll('#featuredGrid button[data-action="view"]').forEach(b=> b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); const id=e.currentTarget.dataset.id; location.hash = '#/item/'+id; }));
  }

  function attachFeaturedButtons(){
    document.querySelectorAll('#featuredGrid button[data-action="view"]').forEach(b=> b.addEventListener('click', e=>{ 
      e.preventDefault(); e.stopPropagation();
      const id=e.currentTarget.dataset.id; 
      if(id){ const it = getItem(id); if(it){ showItemDetailModal(it); return; } }
      location.hash = '#/item/'+id; 
    }));
  }

  // Listen for storage changes (other tabs) and notify current view to refresh if on browse
  window.addEventListener('storage', (e)=>{
    if(e.key===STORAGE_KEY){
      // if currently on browse, re-run browse rendering/filters
      if(location.hash && location.hash.startsWith('#/browse')){
        try{ const q = (new URLSearchParams(location.hash.split('?')[1]||'')).get('q') || ''; renderBrowseItems(q); }catch(err){ console.warn('refresh browse on storage err',err); }
      }
    }
  });

  // In-page publish/subscribe: when items are updated via admin buttons we call updateItem(),
  // so dispatch a custom event to let other components refresh immediately in the same tab.
  function notifyItemsChanged(){
    try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){}
  }

  // Listen and refresh when our signal fires
  window.addEventListener('lf:items:changed', ()=>{
    if(location.hash && location.hash.startsWith('#/browse')){
      try{ const q = (new URLSearchParams(location.hash.split('?')[1]||'')).get('q') || ''; renderBrowseItems(q); }catch(err){/*ignore*/}
    }
  });

  attachBrowseButtons();
  animateBrowseUI();
    // populate featured cards with approved items first, otherwise show sample assets
  try{
    const featured = document.getElementById('featuredGrid');
    const approvedItems = loadItems().filter(i=>i.approved).slice().reverse();
    const samples = [
      {title:'Blue Backpack (Lost)', image:'static/assets/Blue_backpack.jpg'},
      {title:'Lunch Bag (Lost)', image:'static/assets/lunchbag_lost.jpg'},
      {title:'Water Bottle', image:'static/assets/waterbottle_1.jpg'},
      {title:'Wireless Earbuds', image:'static/assets/airopods.jpg'},
      {title:'Glasses (Lost)', image:'static/assets/lost_glasses.jpg'},
    ];

    // build HTML for approved items
    const approvedHTML = approvedItems.map(it=>{
      return `
        <article class="card browse-card reveal tilt-card" data-id="${it.id}">
          <div class="card-visual" style="width:220px;height:140px">
            ${it.image?`<img src="${it.image}" alt="${escapeHtml(it.title)}">`:''}
            <div class="overlay"></div>
          </div>
          <div class="card-body">
            <h2 style="margin:6px 0 6px;font-size:1.05rem">${escapeHtml(it.title)}</h2>
            <p class="muted" style="margin:0 0 6px">Found: ${escapeHtml(it.location||'Unknown')}</p>
            <p class="small-muted" style="margin:0 0 8px">${escapeHtml((it.description||'').slice(0,120))}</p>
            <div class="card-actions" style="display:flex;gap:8px;margin-top:8px"><button class="btn small" data-id="${it.id}" data-action="view">View</button><button class="btn secondary small" data-id="${it.id}" data-action="claim">Claim</button></div>
          </div>
        </article>`;
    }).join('');

    // sample HTML
    const samplesHTML = samples.map((s,idx)=>{
      return `
        <article class="card browse-card reveal tilt-card sample-card" data-index="${idx}" data-title="${escapeHtml(s.title)}">
          <div class="card-visual" style="width:220px;height:140px">
            <img src="${s.image}" alt="${escapeHtml(s.title)}">
            <div class="overlay"></div>
          </div>
          <div class="card-body">
            <h2 style="margin:6px 0 6px;font-size:1.05rem">${escapeHtml(s.title)}</h2>
            <p class="muted" style="margin:0 0 6px">Status: <span class="card-badge">Lost</span></p>
            <p class="small-muted" style="margin:0 0 8px">Reported recently — check with the office to claim.</p>
            <div class="card-actions" style="display:flex;gap:8px;margin-top:8px"><button class="btn small" data-index="${idx}" data-action="view-sample">View</button><button class="btn secondary small" data-index="${idx}" data-action="claim-sample">Claim</button></div>
          </div>
        </article>`;
    }).join('');

    featured.innerHTML = (approvedHTML || '') + samplesHTML;

    // wire interactions for both approved items and samples
    const cards = Array.from(featured.querySelectorAll('.tilt-card'));
    cards.forEach(c=>{
      const img = c.querySelector('.card-visual img');
      const viewBtn = c.querySelector('button[data-action="view"]');
      const claimBtn = c.querySelector('button[data-action="claim"]');
      const viewSample = c.querySelector('button[data-action="view-sample"]');
      const claimSample = c.querySelector('button[data-action="claim-sample"]');

      if(img){
        img.addEventListener('click', ()=>{
          const id = c.dataset.id; if(id){ const it = getItem(id); if(it) { showItemDetailModal(it); return; } }
          showItemDetailModal({ id: null, title: c.dataset.title || c.querySelector('h2')?.textContent, image: img.src, description: 'Reported recently — check with the office to claim.' });
        });
      }
      if(viewBtn) viewBtn.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); const id=c.dataset.id; const it=getItem(id); if(it){ showItemDetailModal(it); } else { location.hash = '#/item/'+id; } });
      if(claimBtn) claimBtn.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); const id=c.dataset.id; const it=getItem(id); if(it) showClaimModal({ title: it.title, image: it.image }); else showClaimModal({ title: c.dataset.title, image: c.querySelector('img')?.src }); });
      if(viewSample) viewSample.addEventListener('click', ()=> showItemDetailModal({ id: null, title: c.dataset.title, image: c.querySelector('img')?.src, description: 'Reported recently — check with the office to claim.' }));
      if(claimSample) claimSample.addEventListener('click', ()=> showClaimModal({ title: c.dataset.title, image: c.querySelector('img')?.src }));
      addTiltGlobal(c);
    });

    // entrance animation
    if(window.gsap){ const tl = gsap.timeline(); tl.fromTo(cards, {y:18,opacity:0,scale:0.98,rotationY:6}, {y:0,opacity:1,scale:1,rotationY:0,duration:0.7,stagger:0.08,ease:'expo.out'}); }
    else { cards.forEach((c,i)=> setTimeout(()=> c.classList.add('show'), i*60)); }
  }catch(err){console.warn('populate featured err',err)}
  initEnhancements();
}

// Show a claim modal instructing user to visit front office to verify ownership
function showClaimModal({title, image}){
  try{
    // remove existing if any
    const prev = document.querySelector('.claim-modal'); if(prev) prev.remove();
    const modal = document.createElement('div'); modal.className='claim-modal open';
    const card = document.createElement('div'); card.className='claim-card';
    const h = document.createElement('h3'); h.textContent = title || 'Claim Item';
    const p1 = document.createElement('p'); p1.textContent = 'To claim this item, please visit the front office in person with a photo ID to verify ownership.';
    const p2 = document.createElement('p'); p2.textContent = 'Office hours: Mon–Fri, 8:00 AM — 3:30 PM. If the office is closed, contact the school for pickup arrangements.';
    card.appendChild(h);
    if(image){ const imgEl = document.createElement('img'); imgEl.src = image; imgEl.style='width:100%;height:auto;border-radius:8px;margin:8px 0'; card.appendChild(imgEl); }
    card.appendChild(p1); card.appendChild(p2);
    const actions = document.createElement('div'); actions.className='claim-actions';
    const slip = document.createElement('button'); slip.className='claim-slip'; slip.textContent='Print Claim Slip';
    const ok = document.createElement('button'); ok.className='claim-ok'; ok.textContent='I will go to the office';
    actions.appendChild(ok); actions.appendChild(slip); card.appendChild(actions);
    modal.appendChild(card); document.body.appendChild(modal);

    modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
    ok.addEventListener('click', ()=> modal.remove());
    slip.addEventListener('click', ()=>{
      const w = window.open('','_blank');
      w.document.write(`<html><head><title>Claim Slip</title><style>body{font-family:Inter,Arial;margin:28px;color:#0b1226} .badge{background:${getComputedStyle(document.documentElement).getPropertyValue('--brand-primary')};color:#fff;padding:6px 10px;border-radius:6px}</style></head><body><h2>Claim Slip</h2><p><strong>Item:</strong> ${escapeHtml(title||'')}</p><p><span class="badge">Pensacola High Lost & Found</span></p><p>Please bring this slip and a photo ID to the front office to pick up this item.</p><p><button onclick="window.print()">Print</button></p></body></html>`);
    });
    document.addEventListener('keyup', function esc(e){ if(e.key==='Escape'){ modal.remove(); document.removeEventListener('keyup', esc); } });
  }catch(err){ console.warn('showClaimModal err',err); alert('To claim this item, visit the front office.'); }
}

// Show item detail modal with full image and description; includes Claim action
function showItemDetailModal(it){
  try{
    const prev = document.querySelector('.item-modal'); if(prev) prev.remove();
    const modal = document.createElement('div'); modal.className='claim-modal item-modal open';
    const card = document.createElement('div'); card.className='claim-card';
    const h = document.createElement('h3'); h.textContent = it.title || 'Item';
    const imgEl = document.createElement('img'); if(it.image) { imgEl.src = it.image; imgEl.style='width:100%;height:auto;border-radius:8px;margin:10px 0'; }
    const desc = document.createElement('p'); desc.style='color:var(--card-text);'; desc.textContent = it.description || it.description || 'No additional details provided.';
    const meta = document.createElement('p'); meta.className='muted'; meta.textContent = (it.location?('Found: '+it.location + ' • '):'') + (it.found_date||'');
    card.appendChild(h); if(it.image) card.appendChild(imgEl); card.appendChild(desc); card.appendChild(meta);
    const actions = document.createElement('div'); actions.className='claim-actions';
    const claimBtn = document.createElement('button'); claimBtn.className='claim-slip'; claimBtn.textContent='Claim this item';
    const closeBtn = document.createElement('button'); closeBtn.className='claim-ok'; closeBtn.textContent='Close';
    actions.appendChild(closeBtn); actions.appendChild(claimBtn); card.appendChild(actions);
    modal.appendChild(card); document.body.appendChild(modal);

    modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
    closeBtn.addEventListener('click', ()=> modal.remove());
    claimBtn.addEventListener('click', ()=> { modal.remove(); showClaimModal({ title: it.title, image: it.image }); });
    document.addEventListener('keyup', function esc(e){ if(e.key==='Escape'){ modal.remove(); document.removeEventListener('keyup', esc); } });
  }catch(err){ console.warn('showItemDetailModal err',err); }
}

// Page: Report Lost Items (users report something they lost; admins/others can view reports separately)
function renderReportLostItems(){ setTitle('Report Lost Item - ' + SCHOOL_NAME);
  app.innerHTML = `
    <section class="pro-form" aria-labelledby="lost-heading">
      <h2 id="lost-heading">Report a Lost Item</h2>
      <p class="muted">Tell us about the item you lost so staff can watch for it and contact you if it's found.</p>
      <form id="lostForm" class="form" novalidate>
        <div class="form-row">
          <div>
            <label class="input-label">Item title<input id="l_title" class="field" name="title" required placeholder="e.g. Black backpack with stickers"></label>
          </div>
          <div>
            <label class="input-label">Last seen location<input id="l_location" class="field" name="location" placeholder="e.g. Cafeteria, Bus #12"></label>
          </div>
        </div>
        <div class="form-row">
          <div class="full">
            <label class="input-label">Description<textarea id="l_description" class="field" name="description" rows="4" placeholder="Describe distinctive markings, contents, brand..."></textarea></label>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label class="input-label">Last seen date<input id="l_last_seen" class="field" type="date" name="last_seen"></label>
          </div>
          <div>
            <label class="input-label">Contact email<input id="l_contact_email" class="field" type="email" name="contact_email" placeholder="optional"></label>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label class="input-label">Contact phone<input id="l_contact_phone" class="field" name="contact_phone" placeholder="optional"></label>
          </div>
          <div>
            <label class="input-label">Anonymous? <select id="l_anonymous" class="field"><option value="no">No</option><option value="yes">Yes</option></select></label>
          </div>
        </div>
        <div class="form-row">
          <div class="full">
            <label class="input-label">Photo (optional)</label>
            <div id="lostDropzone" class="dropzone" tabindex="0">
              <div class="dz-preview"><div class="dz-icon">📷</div><div class="dz-meta"><strong>Drag & drop</strong> or <button type="button" id="lostChooseFile" class="btn-ghost">Choose file</button></div></div>
              <input id="l_image" type="file" accept="image/*" style="display:none">
            </div>
            <div id="l_previewArea" style="margin-top:10px"></div>
            <div class="progress" aria-hidden="true"><i id="l_uploadProgress"></i></div>
          </div>
        </div>
        <div class="submit-wrap">
          <button id="lostSubmit" class="btn">Submit Report</button>
          <button type="button" id="lostCancel" class="btn-ghost">Cancel</button>
        </div>
      </form>
    </section>
    <div id="lostSuccess" class="success-modal" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="success-card">
        <h3>Report received</h3>
        <p class="muted">Thank you — staff will monitor found items and contact you if there is a match.</p>
        <p style="margin-top:14px"><button id="lostDone" class="btn">Back to Home</button></p>
      </div>
    </div>
  `;

  // image upload wiring
  const l_imageInput = document.getElementById('l_image');
  const l_dropzone = document.getElementById('lostDropzone');
  const l_choose = document.getElementById('lostChooseFile');
  const l_preview = document.getElementById('l_previewArea');
  const l_progress = document.getElementById('l_uploadProgress');
  l_choose.addEventListener('click', ()=> l_imageInput.click());
  l_dropzone.addEventListener('click', ()=> l_imageInput.click());
  l_dropzone.addEventListener('dragover', e=>{ e.preventDefault(); l_dropzone.style.borderColor = 'var(--accent)'; });
  l_dropzone.addEventListener('dragleave', e=>{ l_dropzone.style.borderColor = ''; });
  l_dropzone.addEventListener('drop', async e=>{ e.preventDefault(); l_dropzone.style.borderColor = ''; const f = e.dataTransfer.files[0]; if(f) await handleLostFile(f); });
  l_imageInput.addEventListener('change', async e=>{ const f = e.target.files[0]; if(f) await handleLostFile(f); });

  async function handleLostFile(file){
    const p = document.createElement('div'); p.className = 'dz-preview';
    const imgEl = document.createElement('img'); const meta = document.createElement('div'); meta.className='dz-meta'; meta.textContent = `${file.name} · ${Math.round(file.size/1024)} KB`;
    p.appendChild(imgEl); p.appendChild(meta); l_preview.innerHTML=''; l_preview.appendChild(p);
    // resize image to max 1200px and return dataURL
    try{
      const dataUrl = await resizeImage(file, 1200, 0.8, progress=>{ l_progress.style.width = progress + '%'; });
      imgEl.src = dataUrl; l_imageInput.dataset.value = dataUrl;
    }catch(err){ console.warn('lost image failed', err); alert('Image processing failed'); }
  }

  document.getElementById('lostCancel').addEventListener('click', ()=> location.hash='#/');
  document.getElementById('lostForm').addEventListener('submit', e=>{
    e.preventDefault();
    const title = document.getElementById('l_title').value.trim();
    if(!title){ alert('Please add a title'); return; }
    const description = document.getElementById('l_description').value.trim();
    const location = document.getElementById('l_location').value.trim();
    const last_seen = document.getElementById('l_last_seen').value || null;
    const contact_email = document.getElementById('l_contact_email').value.trim() || null;
    const contact_phone = document.getElementById('l_contact_phone').value.trim() || null;
    const anonymous = document.getElementById('l_anonymous').value === 'yes';
    const image = l_imageInput.dataset.value || null;
    const reports = loadLostReports();
    const rep = { id: 'r'+Date.now(), title, description, location, last_seen, contact_email: anonymous?null:contact_email, contact_phone: anonymous?null:contact_phone, anonymous, image, created_at: now() };
    reports.push(rep); saveLostReports(reports);
    // show modal
    const sm = document.getElementById('lostSuccess'); sm.classList.add('open'); sm.setAttribute('aria-hidden','false');
    document.getElementById('lostDone').addEventListener('click', ()=>{ sm.classList.remove('open'); location.hash='#/'; });
  });
  initEnhancements();
}

// --- Auth pages (user) ---
function renderLogin(){ setTitle('Login');
  app.innerHTML = `
    <div class="auth-card">
      <h2>Login</h2>
      <form id="loginForm" class="form">
        <label class="input-label">Email<input id="l_email" class="field" type="email" required></label>
        <label class="input-label">Password<input id="l_pass" class="field" type="password" required></label>
        <div class="auth-actions"><button class="btn" type="submit">Login</button><button type="button" class="btn-ghost" onclick="location.hash='#/signup'">Create account</button></div>
        <p class="small-muted">After logging in you can claim items and save preferences.</p>
      </form>
    </div>
  `;
  document.getElementById('loginForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const email = document.getElementById('l_email').value.trim().toLowerCase();
    const pass = document.getElementById('l_pass').value;
    const users = loadUsers();
    const u = users.find(x=>x.email===email);
    if(!u){ alert('No account found'); return; }
    const h = await hashPassword(pass);
    if(h===u.passwordHash){ sessionStorage.setItem('lf_user', u.id); alert('Logged in'); updateAccountNav(); location.hash='#/'; }
    else { alert('Invalid credentials'); }
  });
}

function renderSignup(){ setTitle('Sign Up');
  app.innerHTML = `
    <div class="auth-card">
      <h2>Create Account</h2>
      <form id="signupForm" class="form">
        <label class="input-label">Full name<input id="s_name" class="field" required></label>
        <label class="input-label">Email<input id="s_email" class="field" type="email" required></label>
        <label class="input-label">Password<input id="s_pass" class="field" type="password" required></label>
        <div class="auth-actions"><button class="btn" type="submit">Create account</button><button type="button" class="btn-ghost" onclick="location.hash='#/login'">Back to login</button></div>
        <p class="small-muted">Accounts are stored locally for this demo.</p>
      </form>
    </div>
  `;
  document.getElementById('signupForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const name = document.getElementById('s_name').value.trim();
    const email = document.getElementById('s_email').value.trim().toLowerCase();
    const pass = document.getElementById('s_pass').value;
    if(!name||!email||!pass){ alert('Please complete the form'); return; }
    const users = loadUsers(); if(users.find(u=>u.email===email)){ alert('An account with that email already exists'); return; }
    const h = await hashPassword(pass);
    const user = { id: 'u'+Date.now(), name, email, passwordHash: h, created_at: now() };
    addUserRecord(user);
    sessionStorage.setItem('lf_user', user.id);
    alert('Account created and logged in'); updateAccountNav(); location.hash = '#/';
  });
}

// Account page: show profile, change password, logout


// --- Admin auth pages ---
function renderAdminAuth(){ setTitle('Admin Login');
  app.innerHTML = `
    <div class="auth-card">
      <h2>Admin Login</h2>
      <form id="aLogin" class="form">
        <label class="input-label">Email<input id="a_email" class="field" type="email" required></label>
        <label class="input-label">Password<input id="a_pass" class="field" type="password" required></label>
        <div class="auth-actions"><button class="btn" type="submit">Login</button><button type="button" class="btn-ghost" onclick="location.hash='#/admin-signup'">Register admin</button></div>
        <p class="small-muted">Admin accounts grant dashboard access. For demo, default admin is admin@pensacolahs.edu / secret</p>
      </form>
    </div>
  `;
  document.getElementById('aLogin').addEventListener('submit', async e=>{
    e.preventDefault();
    const email = document.getElementById('a_email').value.trim().toLowerCase();
    const pass = document.getElementById('a_pass').value;
    const admins = loadAdmins(); const a = admins.find(x=>x.email===email);
    if(!a){ alert('Admin not found'); return; }
    const h = await hashPassword(pass);
    if(h===a.passwordHash){ sessionStorage.setItem('lf_admin','1'); sessionStorage.setItem('lf_admin_id', a.id); alert('Admin logged in'); updateAccountNav(); renderAdmin(); }
    else alert('Invalid credentials');
  });
}

function renderAdminSignup(){ setTitle('Admin Sign Up');
  app.innerHTML = `
    <div class="auth-card">
      <h2>Register Admin</h2>
      <form id="aSignup" class="form">
        <label class="input-label">Full name<input id="ad_name" class="field" required></label>
        <label class="input-label">Email<input id="ad_email" class="field" type="email" required></label>
        <label class="input-label">Password<input id="ad_pass" class="field" type="password" required></label>
        <label class="input-label">Admin code<input id="ad_code" class="field" type="text" required placeholder="Enter school admin code"></label>
        <div class="auth-actions"><button class="btn" type="submit">Create Admin</button><button type="button" class="btn-ghost" onclick="location.hash='#/admin-login'">Back to admin login</button></div>
        <p class="small-muted">Admin accounts are stored locally in this demo.</p>
      </form>
    </div>
  `;
  document.getElementById('aSignup').addEventListener('submit', async e=>{
    e.preventDefault();
    const name = document.getElementById('ad_name').value.trim();
    const email = document.getElementById('ad_email').value.trim().toLowerCase();
    const pass = document.getElementById('ad_pass').value;
    const code = document.getElementById('ad_code').value.trim();
    if(!name||!email||!pass||!code){ alert('Please complete the form'); return; }
    if(code!==ADMIN_SIGNUP_CODE){ alert('Invalid admin code'); return; }
    const admins = loadAdmins(); if(admins.find(x=>x.email===email)){ alert('Admin with that email exists'); return; }
    const h = await hashPassword(pass);
    const a = { id: 'a'+Date.now(), name, email, passwordHash: h, created_at: now() };
    addAdminRecord(a);
    sessionStorage.setItem('lf_admin','1'); sessionStorage.setItem('lf_admin_id', a.id);
    alert('Admin created and logged in'); renderAdmin(); updateAccountNav();
  });
}

function logout(){ sessionStorage.removeItem('lf_user'); alert('Logged out'); updateAccountNav(); location.hash = '#/'; }
function adminLogout(){ sessionStorage.removeItem('lf_admin'); sessionStorage.removeItem('lf_admin_id'); alert('Admin logged out'); updateAccountNav(); location.hash = '#/'; }

// --- Combined Auth page (User + Admin panels) ---
// Mount the combined auth UI into any container element (page or modal)
function mountAuthUI(container){
  container.innerHTML = `
    <div class="auth-card" style="max-width:980px;margin:18px auto;padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap">
        <div class="role-toggle" role="tablist" aria-label="Select role">
          <button id="role-user" class="active" role="tab" aria-selected="true">Student</button>
          <button id="role-admin" role="tab">Admin</button>
        </div>
        <div style="font-size:0.95rem;color:var(--muted)">Choose role to show Sign up / Log in</div>
      </div>
      <div id="auth-body" style="margin-top:14px">
        <!-- default content inserted by script -->
      </div>
    </div>
  `;

  const authBody = container.querySelector('#auth-body');
  let role = 'user';
  let mode = 'signup';

  // helper: show inline error inside a form container
  function clearFormError(form){
    const prev = form.querySelector('.form-error'); if(prev) prev.remove();
  }
  function showFormError(form, msg){
    clearFormError(form);
    const d = document.createElement('div'); d.className = 'form-error'; d.style.color = '#ffdddd'; d.style.background = 'rgba(122,0,30,0.12)'; d.style.padding = '8px 10px'; d.style.borderRadius = '8px'; d.style.marginTop = '8px'; d.style.fontWeight = '700'; d.textContent = msg; form.appendChild(d);
  }

  function renderPanel(){
    if(role==='user'){
      if(mode==='signup'){
        authBody.innerHTML = `
          <h2 style="font-family:Poppins,Inter">Student Sign Up</h2>
          <form id="sform" class="form">
            <label class="input-label">Full name<input id="s_name" class="field" required></label>
            <label class="input-label">Email<input id="s_email" class="field" type="email" required></label>
            <label class="input-label">Password<input id="s_pass" class="field" type="password" required></label>
            <div class="auth-actions"><button class="btn" type="submit">Create account</button></div>
            <div class="auth-toggle">Already have an account? <a href="#" id="toLogin">Log in</a></div>
          </form>
        `;
        authBody.querySelector('#sform').addEventListener('submit', async e=>{
          e.preventDefault(); const form = authBody.querySelector('#sform'); clearFormError(form);
          const name=container.querySelector('#s_name').value.trim(); const email=container.querySelector('#s_email').value.trim().toLowerCase(); const pass=container.querySelector('#s_pass').value;
          if(!name||!email||!pass){ showFormError(form,'Please complete all fields'); return; }
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showFormError(form,'Please provide a valid email address'); return; }
          if(pass.length < 6){ showFormError(form,'Password must be at least 6 characters'); return; }
          if(loadUsers().find(u=>u.email===email)){ showFormError(form,'Email already in use'); return; }
          const h=await hashPassword(pass);
          const user={id:'u'+Date.now(),name,email,passwordHash:h,created_at:now()}; addUserRecord(user); sessionStorage.setItem('lf_user', user.id);
          alert('Account created'); closeAuthModal(); updateAccountNav();
        });
        authBody.querySelector('#toLogin').addEventListener('click', e=>{ e.preventDefault(); mode='login'; renderPanel(); });
      } else {
        authBody.innerHTML = `
          <h2 style="font-family:Poppins,Inter">Student Login</h2>
          <form id="lform" class="form">
            <label class="input-label">Email<input id="l_email" class="field" type="email" required></label>
            <label class="input-label">Password<input id="l_pass" class="field" type="password" required></label>
            <div class="auth-actions"><button class="btn" type="submit">Login</button></div>
            <div class="auth-toggle">Don't have an account? <a href="#" id="toSignup">Create one</a></div>
          </form>
        `;
        authBody.querySelector('#lform').addEventListener('submit', async e=>{
          e.preventDefault(); const form = authBody.querySelector('#lform'); clearFormError(form);
          const email=container.querySelector('#l_email').value.trim().toLowerCase(); const pass=container.querySelector('#l_pass').value;
          if(!email||!pass){ showFormError(form,'Please enter email and password'); return; }
          const u=loadUsers().find(x=>x.email===email);
          if(!u){ showFormError(form,'Account does not exist'); return; }
          const h=await hashPassword(pass);
          if(h===u.passwordHash){ sessionStorage.setItem('lf_user', u.id); alert('Logged in'); closeAuthModal(); updateAccountNav(); }
          else { showFormError(form,'Wrong password'); }
        });
        authBody.querySelector('#toSignup').addEventListener('click', e=>{ e.preventDefault(); mode='signup'; renderPanel(); });
      }
    } else {
      if(mode==='signup'){
        authBody.innerHTML = `
          <h2 style="font-family:Poppins,Inter">Admin Sign Up</h2>
          <form id="asform" class="form">
            <label class="input-label">Full name<input id="ad_name" class="field" required></label>
            <label class="input-label">Email<input id="ad_email" class="field" type="email" required></label>
            <label class="input-label">Password<input id="ad_pass" class="field" type="password" required></label>
            <label class="input-label">Admin code<input id="ad_code" class="field" type="text" placeholder="Enter school admin code" required></label>
            <div class="auth-actions"><button class="btn" type="submit">Create Admin</button></div>
            <div class="auth-toggle">Already an admin? <a href="#" id="toALogin">Log in</a></div>
          </form>
        `;
        authBody.querySelector('#asform').addEventListener('submit', async e=>{ e.preventDefault(); const name=container.querySelector('#ad_name').value.trim(); const email=container.querySelector('#ad_email').value.trim().toLowerCase(); const pass=container.querySelector('#ad_pass').value; const code=container.querySelector('#ad_code').value.trim(); if(!name||!email||!pass||!code){ alert('Complete the form'); return; } if(code!==ADMIN_SIGNUP_CODE){ alert('Invalid admin code'); return; } if(loadAdmins().find(a=>a.email===email)){ alert('Admin exists'); return; } const h=await hashPassword(pass); const a={id:'a'+Date.now(),name,email,passwordHash:h,created_at:now()}; addAdminRecord(a); sessionStorage.setItem('lf_admin','1'); sessionStorage.setItem('lf_admin_id', a.id); alert('Admin created'); closeAuthModal(); renderAdmin(); });
        authBody.querySelector('#toALogin').addEventListener('click', e=>{ e.preventDefault(); mode='login'; renderPanel(); });
      } else {
        authBody.innerHTML = `
          <h2 style="font-family:Poppins,Inter">Admin Login</h2>
          <form id="alform" class="form">
            <label class="input-label">Email<input id="a_email" class="field" type="email" required></label>
            <label class="input-label">Password<input id="a_pass" class="field" type="password" required></label>
            <div class="auth-actions"><button class="btn" type="submit">Login</button></div>
            <div class="auth-toggle">Need an admin account? <a href="#" id="toASignup">Create one</a></div>
          </form>
        `;
        authBody.querySelector('#alform').addEventListener('submit', async e=>{ 
          e.preventDefault();
          const email = container.querySelector('#a_email').value.trim().toLowerCase();
          const pass = container.querySelector('#a_pass').value;
          const a = loadAdmins().find(x=>x.email===email);
          if(!a){ alert('Not found'); return; }
          const h = await hashPassword(pass);
          if(h === a.passwordHash){
            sessionStorage.setItem('lf_admin','1');
            sessionStorage.setItem('lf_admin_id', a.id);
            alert('Admin logged in');
            closeAuthModal();
            updateAccountNav();
            renderAdmin();
          } else alert('Invalid');
        });
        authBody.querySelector('#toASignup').addEventListener('click', e=>{ e.preventDefault(); mode='signup'; renderPanel(); });
      }
    }
  }

  // role toggle wiring
  container.querySelector('#role-user').addEventListener('click', ()=>{ role='user'; container.querySelector('#role-user').classList.add('active'); container.querySelector('#role-admin').classList.remove('active'); mode='signup'; renderPanel(); });
  container.querySelector('#role-admin').addEventListener('click', ()=>{ role='admin'; container.querySelector('#role-admin').classList.add('active'); container.querySelector('#role-user').classList.remove('active'); mode='signup'; renderPanel(); });

  // initial render
  role='user'; mode='signup'; renderPanel();
}

// Close helper for modal
function closeAuthModal(){
  const m = document.getElementById('authModal');
  if(!m) return;
  // start closing animation
  m.classList.remove('open');
  // detach key handler
  if(window._authModalKeyHandler){ window.removeEventListener('keydown', window._authModalKeyHandler); window._authModalKeyHandler = null; }
  // detach outside-click handler stored on element
  if(m._outsideHandler){ m.removeEventListener('click', m._outsideHandler); m._outsideHandler = null; }
  // restore focus to opener if we saved one
  try{ if(window._lastActiveElementBeforeAuth){ window._lastActiveElementBeforeAuth.focus(); } }catch(e){}
  window._lastActiveElementBeforeAuth = null;
  // remove from DOM after animation completes
  setTimeout(()=>{ try{ m.remove(); }catch(e){} }, 380);
}

// Create and open an auth modal mounted with the same UI
function showAuthModal(){
  // avoid duplicate
  if(document.getElementById('authModal')) return;
  // remember the element that had focus so we can restore it
  try{ window._lastActiveElementBeforeAuth = document.activeElement; }catch(e){ window._lastActiveElementBeforeAuth = null; }
  const modal = document.createElement('div'); modal.id='authModal'; modal.className='auth-modal';
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-label','Authentication');
  const inner = document.createElement('div'); inner.style.position='relative';
  inner.innerHTML = `<button class="close-auth" aria-label="Close">×</button><div id="authModalBody"></div>`;
  modal.appendChild(inner); document.body.appendChild(modal);
  // mount UI into modal body
  const body = modal.querySelector('#authModalBody'); mountAuthUI(body);
  // open with animation
  setTimeout(()=> modal.classList.add('open'), 10);
  modal.querySelector('.close-auth').addEventListener('click', closeAuthModal);

  // outside-click closes modal
  modal._outsideHandler = function(e){ if(e.target === modal) closeAuthModal(); };
  modal.addEventListener('click', modal._outsideHandler);

  // ESC key closes modal
  window._authModalKeyHandler = function(e){
    try{
      if(!document.getElementById('authModal')) return;
      // ESC closes modal
      if(e.key === 'Escape' || e.key === 'Esc'){ e.preventDefault(); closeAuthModal(); return; }
      // Trap Tab inside modal
      if(e.key === 'Tab'){
        const m = document.getElementById('authModal'); if(!m) return;
        const focusable = Array.from(m.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
                          .filter(el=> el.offsetParent !== null);
        if(focusable.length === 0) return;
        const first = focusable[0]; const last = focusable[focusable.length-1];
        if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
        else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
      }
    }catch(err){}
  };
  window.addEventListener('keydown', window._authModalKeyHandler);

  // focus first focusable element inside modal once open
  setTimeout(()=>{ try{ const f = modal.querySelector('input,button,select,textarea'); if(f) f.focus(); }catch(e){} }, 260);
}


function renderAdmin(){
  setTitle('Admin Dashboard');
  const logged = sessionStorage.getItem('lf_admin')==='1';
  if(!logged){ renderAdminAuth(); return; }

  const itemsAll = loadItems();
  const lostAll = loadLostReports();
  const messagesAll = loadAdminMessages();
  const approvedCount = itemsAll.filter(it=>it.approved).length;
  const pendingCount = itemsAll.filter(it=>!it.approved).length;

  // Main admin shell with tabs
  app.innerHTML = `
    <div class="admin-shell">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
        <h1 style="margin:0">Admin Dashboard</h1>
        <div><button id="logout" class="btn-ghost">Logout</button></div>
      </div>
      <div class="admin-summary">
        <div class="card admin-summary-card">
          <div class="muted">Total items</div>
          <div class="admin-summary-num">${itemsAll.length}</div>
        </div>
        <div class="card admin-summary-card">
          <div class="muted">Approved</div>
          <div class="admin-summary-num">${approvedCount}</div>
        </div>
        <div class="card admin-summary-card">
          <div class="muted">Pending</div>
          <div class="admin-summary-num">${pendingCount}</div>
        </div>
        <div class="card admin-summary-card">
          <div class="muted">Lost reports</div>
          <div class="admin-summary-num">${lostAll.length}</div>
        </div>
        <div class="card admin-summary-card">
          <div class="muted">Messages</div>
          <div class="admin-summary-num">${messagesAll.length}</div>
        </div>
      </div>
      <div class="admin-tools">
        <input id="adminSearch" class="field" type="search" placeholder="Search items or reports..." aria-label="Search admin items">
        <button id="adminClear" class="btn-ghost">Clear</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button id="tabFound" class="btn small">Found Items</button>
        <button id="tabLost" class="btn small btn-ghost">Lost Reports</button>
        <button id="tabMessages" class="btn small btn-ghost">Messages</button>
      </div>
      <div id="adminArea"></div>
    </div>
  `;

  document.getElementById('logout').addEventListener('click', adminLogout);
  const adminArea = document.getElementById('adminArea');

  // Render found items (items stored in STORAGE_KEY)
  function renderFound(){
    const q = (document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
    const items = loadItems().slice().reverse().filter(it=>{
      if(!q) return true;
      const hay = `${it.title||''} ${it.description||''} ${it.location||''}`.toLowerCase();
      return hay.includes(q);
    });
    adminArea.innerHTML = `
      <section>
        <h2>Found Items (${items.length})</h2>
        <div class="grid">${items.length? items.map(it=>`
          <article class="card admin-card" style="position:relative">
            ${it.image?`<img src="${it.image}" alt="${escapeHtml(it.title)}">`:''}
            <h3>${escapeHtml(it.title)}</h3>
            <p class="muted">${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'')}</p>
            <p>${escapeHtml((it.description||'').slice(0,140))}</p>
            <div style="display:flex;gap:8px;margin-top:10px">
              ${it.approved?'<span class="card-badge">Approved</span>':'<button class="approve btn small" data-id="'+it.id+'">Approve</button>'}
              <button class="edit btn small" data-id="${it.id}">Edit</button>
              <button class="promote btn small btn-ghost" data-id="${it.id}">${it.promoted? 'Unpromote':'Promote'}</button>
              <button class="delete btn small btn-ghost" data-id="${it.id}">Delete</button>
              <button class="view btn small btn-ghost" data-id="${it.id}">View</button>
            </div>
          </article>
        `).join('') : '<div class="card"><p class="muted">No found items yet.</p></div>'}</div>
      </section>
    `;

    // attach handlers
    adminArea.querySelectorAll('.approve').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const it = getItem(id); if(!it) return; it.approved = true; updateItem(it); try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){} renderFound();
    }));
    adminArea.querySelectorAll('.delete').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; if(!id) return; if(!confirm('Delete this item?')) return; deleteItem(id); try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){} renderFound();
    }));
    adminArea.querySelectorAll('.edit').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const it = getItem(id); if(it) openEditItemModal(it, ()=>renderFound());
    }));
    adminArea.querySelectorAll('.promote').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const it = getItem(id); if(!it) return; it.promoted = !it.promoted; updateItem(it); try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){} renderFound();
    }));
    adminArea.querySelectorAll('.view').forEach(btn=> btn.addEventListener('click', e=>{ const id=e.currentTarget.dataset.id; const it = getItem(id); if(it) showItemDetailModal(it); }));
    initEnhancements();
  }

  // Render lost reports (LOST_REPORTS_KEY)
  function renderLost(){
    const q = (document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
    const reports = loadLostReports().slice().reverse().filter(r=>{
      if(!q) return true;
      const hay = `${r.title||''} ${r.description||''} ${r.location||''} ${r.last_seen||''}`.toLowerCase();
      return hay.includes(q);
    });
    adminArea.innerHTML = `
      <section>
        <h2>Lost Reports (${reports.length})</h2>
        <div class="grid">${reports.length? reports.map(r=>`
          <article class="card admin-card">
            ${r.image?`<img src="${r.image}" alt="${escapeHtml(r.title||'Lost report')}">`:''}
            <h3>${escapeHtml(r.title||'Lost report')}</h3>
            <p class="muted">Last seen: ${escapeHtml(r.location||'Unknown')} • ${escapeHtml(r.last_seen||'')}</p>
            <p>${escapeHtml((r.description||'').slice(0,140))}</p>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="convert btn small" data-id="${r.id}">Create Found Item</button>
              <button class="delete-report btn small btn-ghost" data-id="${r.id}">Delete</button>
              <button class="view-report btn small btn-ghost" data-id="${r.id}">View</button>
            </div>
          </article>
        `).join('') : '<div class="card"><p class="muted">No lost reports yet.</p></div>'}</div>
      </section>
    `;

    adminArea.querySelectorAll('.convert').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; const reports = loadLostReports(); const r = reports.find(x=>x.id===id); if(!r) return; // create a found item from report
      const newItem = { id: toId(), title: r.title || 'Found item', description: r.description || '', location: r.location || r.last_seen || '', found_date: r.last_seen || '', image: r.image || null, approved: true, promoted: false, created_at: now(), claims: [] };
      addItem(newItem);
      // remove report
      const remaining = reports.filter(x=>x.id!==id); saveLostReports(remaining);
      try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){}
      renderLost(); renderFound();
    }));
    adminArea.querySelectorAll('.delete-report').forEach(btn=> btn.addEventListener('click', e=>{ const id=e.currentTarget.dataset.id; if(!confirm('Delete this report?')) return; let reps = loadLostReports(); reps = reps.filter(x=>x.id!==id); saveLostReports(reps); renderLost(); }));
    adminArea.querySelectorAll('.view-report').forEach(btn=> btn.addEventListener('click', e=>{ const id=e.currentTarget.dataset.id; const rep = loadLostReports().find(x=>x.id===id); if(rep) showItemDetailModal({ title: rep.title||'Lost report', image: rep.image, description: rep.description }); }));
    initEnhancements();
  }

  // Render admin messages (ADMIN_MESSAGES_KEY)
  function renderMessages(){
    const messages = loadAdminMessages().slice().reverse();
    adminArea.innerHTML = `
      <section>
        <h2>Messages (${messages.length})</h2>
        <div class="grid">${messages.length ? messages.map(m=>`
          <article class="card admin-card">
            <h3 style="margin-bottom:6px">${escapeHtml(m.name||'Anonymous')}</h3>
            <p class="muted">${escapeHtml(m.email||'')} • ${escapeHtml(m.created_at||'')}</p>
            <p>${escapeHtml(m.message||'')}</p>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="delete-msg btn small btn-ghost" data-id="${m.id}">Delete</button>
            </div>
          </article>
        `).join('') : '<div class="card"><p class="muted">No messages yet.</p></div>'}</div>
      </section>
    `;

    adminArea.querySelectorAll('.delete-msg').forEach(btn=> btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id; if(!id) return; if(!confirm('Delete this message?')) return;
      let msgs = loadAdminMessages();
      msgs = msgs.filter(m=>m.id!==id);
      saveAdminMessages(msgs);
      renderMessages();
    }));
    initEnhancements();
  }

  // Small modal to edit an item inline
  function openEditItemModal(it, onSaved){
    try{ const prev = document.querySelector('.item-modal'); if(prev) prev.remove(); const modal = document.createElement('div'); modal.className='claim-modal item-modal open'; const card = document.createElement('div'); card.className='claim-card'; card.innerHTML = `<h3>Edit Item</h3>`;
      const form = document.createElement('form'); form.innerHTML = `
        <label class="input-label">Title<input class="field" id="e_title" value="${escapeHtml(it.title||'')}"></label>
        <label class="input-label">Location<input class="field" id="e_location" value="${escapeHtml(it.location||'')}"></label>
        <label class="input-label">Found date<input class="field" id="e_found" type="date" value="${escapeHtml(it.found_date||'')}"></label>
        <label class="input-label">Description<textarea class="field" id="e_desc">${escapeHtml(it.description||'')}</textarea></label>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="submit" class="btn">Save</button><button type="button" class="claim-ok">Cancel</button></div>
      `;
      card.appendChild(form); modal.appendChild(card); document.body.appendChild(modal);
      modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
      modal.querySelector('.claim-ok').addEventListener('click', ()=> modal.remove());
      form.addEventListener('submit', e=>{ e.preventDefault(); it.title = document.getElementById('e_title').value.trim(); it.location = document.getElementById('e_location').value.trim(); it.found_date = document.getElementById('e_found').value || it.found_date; it.description = document.getElementById('e_desc').value.trim(); updateItem(it); try{ window.dispatchEvent(new Event('lf:items:changed')); }catch(e){} modal.remove(); if(typeof onSaved==='function') onSaved(); });
    }catch(err){ console.warn('edit modal err',err); }
  }

  // tab wiring
  const tabFound = document.getElementById('tabFound');
  const tabLost = document.getElementById('tabLost');
  const tabMessages = document.getElementById('tabMessages');
  const adminSearch = document.getElementById('adminSearch');
  const adminClear = document.getElementById('adminClear');
  function setActiveTab(active){
    [tabFound, tabLost, tabMessages].forEach(t=> t.classList.add('btn-ghost'));
    active.classList.remove('btn-ghost');
  }
  tabFound.addEventListener('click', ()=>{ setActiveTab(tabFound); renderFound(); });
  tabLost.addEventListener('click', ()=>{ setActiveTab(tabLost); renderLost(); });
  tabMessages.addEventListener('click', ()=>{ setActiveTab(tabMessages); renderMessages(); });
  if(adminSearch){ adminSearch.addEventListener('input', ()=>{
    if(tabFound && !tabFound.classList.contains('btn-ghost')) renderFound();
    else if(tabLost && !tabLost.classList.contains('btn-ghost')) renderLost();
  }); }
  if(adminClear){ adminClear.addEventListener('click', ()=>{
    if(adminSearch) adminSearch.value = '';
    if(tabFound && !tabFound.classList.contains('btn-ghost')) renderFound();
    else if(tabLost && !tabLost.classList.contains('btn-ghost')) renderLost();
  }); }

  // default
  renderFound();
}

function seedDemoItems(){
  const demo = [
    { id: toId(), title: 'Black Backpack with Keychain', description: 'Found near the science wing. Contains notebooks.', location: 'Science Wing', found_date: '2026-01-14', image: 'static/assets/sample1.jpg', approved: true, created_at: now(), claims: [] },
    { id: toId(), title: 'Silver Water Bottle', description: 'Stainless steel water bottle with sticker.', location: 'Gym', found_date: '2026-01-12', image: 'static/assets/sample2.jpg', approved: true, created_at: now(), claims: [] }
  ];
  const items = loadItems(); demo.forEach(d=>{ items.push(d); }); saveItems(items);
}

// Router
function handleRoute(){
  const hash = location.hash || '#/';
  const [rawPath, ...rest] = hash.slice(2).split('/');
  const path = rawPath || '';
  const qs = new URLSearchParams((location.hash.split('?')[1]) || '');
  const q = qs.get('q') || '';

  // Redirect any admin-related routes to home if not logged in as admin
  try{
    if(path && path.startsWith('admin')){
      const logged = sessionStorage.getItem('lf_admin')==='1';
      if(!logged){ location.hash = '#/'; return; }
    }
  }catch(e){}

  // toggle home-mode container for full-bleed hero
  const isHome = (path === '' || path === '?');
  const mainContainer = document.querySelector('main.container');
  if(mainContainer){ if(isHome) mainContainer.classList.add('home-mode'); else mainContainer.classList.remove('home-mode'); }
  // No header-centering on home — keep header in its original position

  // remove header browse search when not on the browse page
  try{
    const headerSearch = document.querySelector('.header-browse-search');
    if(headerSearch && path !== 'browse') headerSearch.remove();
  }catch(e){}

  // route dispatch
  if(path === '' || path === '?') {
    // If we have a preserved static home snapshot (served HTML), restore it
    if(_staticHomeHTML){
      try{ app.innerHTML = _staticHomeHTML; }catch(e){}
      // re-run visuals and wiring
      try{ initEnhancements(); animateHome(); }catch(e){}
      // Ensure the recent items grid is populated from storage if empty
      try{
        const homeGrid = app.querySelector('#homeGrid');
        if(homeGrid && homeGrid.children.length === 0){
          const items = loadItems() || [];
          const approved = items.filter(it=>it.approved).slice().reverse().slice(0,6);
          if(approved.length){
            homeGrid.innerHTML = approved.map(it=>`
              <article class="card reveal">
                ${it.image?`<img src="${it.image}" alt="Photo of ${escapeHtml(it.title)}">`:''}
                <h2>${escapeHtml(it.title)}</h2>
                <p class="muted">Found: ${escapeHtml(it.location||'Unknown')} • ${escapeHtml(it.found_date||'Date unknown')}</p>
                <p class="small-muted">${escapeHtml((it.description||'').slice(0,120))}</p>
                <p style="margin-top:10px"><button class="btn" data-action="view" data-id="${it.id}">View</button></p>
              </article>
            `).join('');
            // wire view buttons
            homeGrid.querySelectorAll('button[data-action="view"]').forEach(btn=> btn.addEventListener('click', e=>{ e.preventDefault(); const id = btn.dataset.id; const it = getItem(id); if(it) showItemDetailModal(it); }));
          }
        }
      }catch(e){}
      // quick sanity check: if cards are missing, fetch fresh static content and restore
      try{
        const hasCards = app.querySelectorAll && app.querySelectorAll('.card').length > 0;
        if(!hasCards){
          fetch('index.html', {cache: 'no-store'}).then(r=>r.text()).then(txt=>{
            try{
              const p = new DOMParser(); const doc = p.parseFromString(txt, 'text/html'); const a = doc.getElementById('app');
              if(a && a.innerHTML.trim()){
                _staticHomeHTML = a.innerHTML;
                app.innerHTML = _staticHomeHTML;
                try{ initEnhancements(); animateHome(); }catch(e){}
              }
            }catch(e){}
          }).catch(()=>{});
        }
      }catch(e){}
      return;
    }
    renderHome(q);
  }
  else if(path === 'submit') renderSubmit();
  else if(path === 'lost') renderLost(qs.get('q')||'');
  else if(path === 'report-lost') renderReportLostItems();
  else if(path === 'browse') renderBrowseItems(qs.get('q')||'');
  else if(path === 'help') renderHelp();
  else if(path === 'login') renderLogin();
  else if(path === 'signup') renderSignup();
  else if(path === 'auth') { showAuthModal(); location.hash = '#/'; }
  else if(path === 'item'){ const id = rest[0]; renderItem(id); }
  else if(path === 'admin') renderAdmin();
  else if(path === 'admin-login') renderAdminAuth();
  else if(path === 'admin-signup') renderAdminSignup();
  else if(path === 'logout') logout();
  else if(path === 'admin-logout') adminLogout();
  else renderHome();
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', ()=>{
  try{ setSchoolBackground(); }catch(e){}
  // Only run the router on load if a non-root hash is present.
  // This prevents the SPA from overwriting a custom static home markup inserted server-side.
  try{
    const h = location.hash || '';
    if(h && h !== '#' && h !== '#/' && h !== ''){
      handleRoute();
    }
    // Capture the static home markup so we can restore it when navigating back
    try{ const isRoot = !h || h === '#' || h === '#/'; if(isRoot){ _staticHomeHTML = app.innerHTML; } }catch(e){}
  }catch(e){}
  try{ document.getElementById('year').textContent = new Date().getFullYear(); }catch(e){}
  try{ updateAccountNav(); }catch(e){}
});

// Intercept header Account link to open modal instead of navigating
window.addEventListener('load', ()=>{
  try{
    const accountLink = document.querySelector('nav a[href="#/auth"]');
    if(accountLink){ accountLink.addEventListener('click', e=>{ e.preventDefault(); showAuthModal(); }); }
    // create a persistent Sign In button next to the nav toggle (top-right)
    try{
      const headerContainer = document.querySelector('.site-header .container');
      if(headerContainer){
        let topBtn = headerContainer.querySelector('#authTopBtn');
        if(!topBtn){
          topBtn = document.createElement('button');
          topBtn.id = 'authTopBtn';
          topBtn.className = 'btn-ghost';
          topBtn.type = 'button';
          topBtn.setAttribute('aria-label','Sign in or register');
          topBtn.textContent = 'Sign In';
          // insert next to nav-toggle if present
          const navToggle = headerContainer.querySelector('.nav-toggle');
          // Insert the Sign In button before the nav toggle so the menu appears to the right of it
          if(navToggle && navToggle.parentNode === headerContainer){ headerContainer.insertBefore(topBtn, navToggle); }
          else { headerContainer.appendChild(topBtn); }
          topBtn.addEventListener('click', e=>{ e.preventDefault(); showAuthModal(); });
        }
      }
    }catch(err){}
  }catch(e){}
});

// Fallback: delegate any click on anchors that point to #/auth to open the auth modal
document.addEventListener('click', (e)=>{
  try{
    const a = e.target.closest && e.target.closest('a[href="#/auth"]');
    if(a){ e.preventDefault(); showAuthModal(); }
  }catch(err){}
});

// Initialize nav dropdown toggle (clones nav links into a click-open panel)
function initNavDropdown(){
  try{
    const headerContainer = document.querySelector('.site-header .container');
    if(!headerContainer) return;
    const toggle = headerContainer.querySelector('.nav-toggle');
    const nav = headerContainer.querySelector('nav#mainNav') || headerContainer.querySelector('nav');
    if(!toggle || !nav) return;
    // create dropdown if missing
    let dropdown = document.getElementById('navDropdown');
    if(!dropdown){ dropdown = document.createElement('div'); dropdown.id='navDropdown'; dropdown.className='nav-dropdown'; dropdown.setAttribute('role','menu'); headerContainer.appendChild(dropdown); }
    // populate from nav links
    dropdown.innerHTML = '';
    Array.from(nav.querySelectorAll('a')).forEach(a=>{
      const link = document.createElement('a'); link.href = a.getAttribute('href'); link.textContent = a.textContent; link.setAttribute('role','menuitem'); dropdown.appendChild(link);
    });

    function openMenu(){ toggle.setAttribute('aria-expanded','true'); dropdown.classList.add('show'); dropdown.setAttribute('aria-hidden','false'); if(window.gsap) gsap.fromTo(dropdown,{y:-8,opacity:0},{y:0,opacity:1,duration:0.36,ease:'power2.out'}); }
    function closeMenu(){ toggle.setAttribute('aria-expanded','false'); dropdown.classList.remove('show'); dropdown.setAttribute('aria-hidden','true'); }

    toggle.addEventListener('click', (e)=>{ e.stopPropagation(); const isOpen = toggle.getAttribute('aria-expanded')==='true'; if(isOpen) closeMenu(); else openMenu(); });

    // close on outside click
    document.addEventListener('click', (e)=>{ if(!dropdown.contains(e.target) && e.target!==toggle){ closeMenu(); } });
    // close on ESC
    window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' || e.key === 'Esc'){ closeMenu(); } });

    // clicking a dropdown link should close menu
    dropdown.addEventListener('click', (e)=>{ const t = e.target.closest('a'); if(t){ closeMenu(); } });
  }catch(e){ console.warn('initNavDropdown error', e); }
}

window.addEventListener('load', ()=>{ try{ initNavDropdown(); }catch(e){} });

// Initialize 3D AR/VR scene
let _3d = { running:false, scene:null, camera:null, renderer:null, group:null, video:null, videoTex:null, raf: null };
function init3D(){ try{
    if(!window.THREE) return;
    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.domElement.id = 'three-canvas'; document.body.appendChild(renderer.domElement);
    // scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 2000); camera.position.set(0,0,60);
    // lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6)); const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(10,20,10); scene.add(dl);
    // floating group
    const group = new THREE.Group();
    const matA = new THREE.MeshStandardMaterial({ color: 0x7a001e, metalness:0.2, roughness:0.4 });
    const matB = new THREE.MeshStandardMaterial({ color: 0xe3b23c, metalness:0.6, roughness:0.2 });
    const geo1 = new THREE.BoxGeometry(12,8,4); const geo2 = new THREE.SphereGeometry(6, 24, 20);
    const m1 = new THREE.Mesh(geo1, matA); m1.position.set(-18, -2, 0); m1.rotation.set(0.2, -0.4, 0.1);
    const m2 = new THREE.Mesh(geo2, matB); m2.position.set(12, 6, -4);
    group.add(m1,m2);
    // subtle school logo plane (if available)
    try{ const tex = new THREE.TextureLoader().load('static/assets/phs_logo.jpg'); const lg = new THREE.Mesh(new THREE.PlaneGeometry(18,12), new THREE.MeshBasicMaterial({map:tex, transparent:true})); lg.position.set(0,-18,-6); group.add(lg);}catch(e){}
    scene.add(group);

    // store references
    _3d.scene = scene; _3d.camera = camera; _3d.renderer = renderer; _3d.group = group; _3d.running = true;

    // resize handling
    window.addEventListener('resize', ()=>{ if(!_3d.renderer) return; _3d.camera.aspect = window.innerWidth/window.innerHeight; _3d.camera.updateProjectionMatrix(); _3d.renderer.setSize(window.innerWidth, window.innerHeight); });

    // mouse/device parallax
    let mx=0,my=0; window.addEventListener('mousemove', e=>{ mx = (e.clientX - window.innerWidth/2)/window.innerWidth*2; my = (e.clientY - window.innerHeight/2)/window.innerHeight*2; });
    window.addEventListener('deviceorientation', ev=>{ if(ev.beta||ev.gamma){ mx = (ev.gamma||0)/30; my = (ev.beta||0)/30; } }, {passive:true});

    // render loop
    const animate = ()=>{
      if(!_3d.running) return;
      // gentle floating rotation
      const t = Date.now()*0.001;
      group.rotation.y = 0.25*Math.sin(t*0.6) + 0.2*mx;
      group.rotation.x = 0.12*Math.sin(t*0.4) + 0.12*my;
      // bob
      group.position.y = 4*Math.sin(t*0.9);
      renderer.render(scene, camera);
      _3d.raf = requestAnimationFrame(animate);
    };
    animate();
  }catch(e){ console.warn('3D init failed', e); }
}

async function startARMode(){ try{
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Camera not available');
    // request camera, set as scene background
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false });
    const video = document.createElement('video'); video.autoplay=true; video.muted=true; video.playsInline=true; video.srcObject = stream; await video.play();
    _3d.video = video;
    if(_3d.renderer && _3d.scene){ const tex = new THREE.VideoTexture(video); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.format = THREE.RGBFormat; _3d.scene.background = tex; _3d.videoTex = tex; document.documentElement.classList.add('ar-active'); }
  }catch(e){ console.warn('startARMode failed', e); }
}

function stopARMode(){ try{ if(_3d.video && _3d.video.srcObject){ const tracks = _3d.video.srcObject.getTracks(); tracks.forEach(t=>t.stop()); _3d.video.srcObject = null; _3d.video = null; }
    if(_3d.scene) _3d.scene.background = null; document.documentElement.classList.remove('ar-active'); }catch(e){}
}

// ensure 3D initializes after DOM ready and if THREE present
try{ window.addEventListener('load', ()=>{ setTimeout(()=>{ try{ init3D(); }catch(e){} }, 260); }); }catch(e){}

/* Enhancements: animations and lightbox */
function initEnhancements(){
  try{ if(window.gsap) gsap.from('.card, .visual-card, .hero h1, .hero p', {y:18, opacity:0, stagger:0.06, duration:0.7, ease:'expo.out'}); }catch(e){}
  document.querySelectorAll('.card img, .visual-card img, .item-detail img').forEach(img=>{
    img.style.cursor='zoom-in';
    img.addEventListener('click', ()=> openLightbox(img.src, img.alt));
  });
  // advanced GSAP hero timeline and subtle parallax
  try{
    if(window.gsap){
      const tl = gsap.timeline({defaults:{ease:'expo.out'}});
      tl.from('.hero-inner h1',{y:36,opacity:0,duration:0.9});
      tl.from('.hero-inner p',{y:18,opacity:0,duration:0.6},'-=0.5');
      tl.from('.hero-cta .btn',{y:8,opacity:0,stagger:0.08,duration:0.5, ease:'back.out(1.1)'},'-=0.4');
      tl.from('.visual-card',{y:20,rotation:-4,opacity:0,duration:0.9},'-=0.7');
      // animate new sections
      tl.from('.carousel',{y:22,opacity:0,duration:0.7},'-=0.6');
      tl.from('.features .feature-card',{y:28,opacity:0,stagger:0.08,duration:0.6},'-=0.5');
      tl.from('.steps .step',{y:24,opacity:0,stagger:0.06,duration:0.5},'-=0.6');
      tl.from('.stats .stat',{scale:0.92,opacity:0,stagger:0.06,duration:0.6},'-=0.55');
      // subtle entrance for info card and hero blob
      tl.from('.info-card',{y:18,opacity:0,duration:0.6},'-=0.4');
      // animate decorative hero graphic subtly
      try{ gsap.to('.hero-content',{y:-4, duration:10, repeat:-1, yoyo:true, ease:'sine.inOut'}); }catch(e){}
    }
  }catch(e){}

  // parallax effect for hero background on scroll
  let lastScroll = 0;
  window.addEventListener('scroll', ()=>{
    const hero = document.querySelector('.hero');
    if(!hero) return;
    const sc = window.scrollY || window.pageYOffset;
    if(Math.abs(sc - lastScroll) < 2) return;
    lastScroll = sc;
    const pos = Math.max(30, 50 + sc * 0.02);
    hero.style.backgroundPosition = `center ${pos}%`;
  }, {passive:true});
}

/* Animate header nav items and decorative blob using GSAP */
function animateHeaderNav(){
  try{
    if(!window.gsap) return;
    const navItems = document.querySelectorAll('.site-header nav a');
    if(navItems && navItems.length){
      gsap.from(navItems, {y:10, opacity:0, stagger:0.06, duration:0.6, ease:'power3.out', delay:0.18});
    }
    // add a decorative blob element if missing
    if(!document.querySelector('.nav-blob')){
      const blob = document.createElement('div'); blob.className='nav-blob'; document.querySelector('.site-header .container').appendChild(blob);
      // gentle float animation
      gsap.to(blob, {x: -8, y: 6, duration:4, repeat:-1, yoyo:true, ease:'sine.inOut'});
      gsap.to(blob, {rotation:3, duration:8, repeat:-1, yoyo:true, ease:'sine.inOut'});
    }
  }catch(e){/* ignore */}
}

// run header nav animation after load
window.addEventListener('load', ()=>{ try{ animateHeaderNav(); }catch(e){} });

/* Carousel initialization */
function initCarousel(){
  const track = document.querySelector('.carousel-track');
  if(!track) return;
  const items = Array.from(track.children);
  let index = 0;
  function show(i){
    index = (i + items.length) % items.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }
  document.getElementById('prev')?.addEventListener('click', ()=> show(index-1));
  document.getElementById('next')?.addEventListener('click', ()=> show(index+1));
  // auto-play
  let autoplay = setInterval(()=> show(index+1), 5000);
  track.addEventListener('mouseenter', ()=> clearInterval(autoplay));
  track.addEventListener('mouseleave', ()=> autoplay = setInterval(()=> show(index+1), 5000));
  show(0);

  // FAQ toggles
  document.querySelectorAll('.faq-item').forEach(fi=>{
    fi.querySelector('.q').addEventListener('click', ()=> fi.classList.toggle('open'))
  });
}

function openLightbox(src, alt){
  let lb = document.getElementById('lf-lightbox');
  if(!lb){ lb = document.createElement('div'); lb.id='lf-lightbox'; lb.className='lightbox'; lb.innerHTML = `<button id="lb-close" aria-label="Close" style="position:absolute;top:28px;right:28px;background:transparent;border:none;color:#fff;font-size:28px;cursor:pointer">×</button><img src="" alt="">`;
    document.body.appendChild(lb);
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', e=>{ if(e.target===lb) closeLightbox(); });
  }
  const img = lb.querySelector('img'); img.src = src; img.alt = alt||''; lb.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeLightbox(){ const lb = document.getElementById('lf-lightbox'); if(!lb) return; lb.classList.remove('open'); document.body.style.overflow=''; }

// small utilities
function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file); }); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'\\\\','"':'&quot;'}[c])); }

// resize image using canvas (returns dataURL)
function resizeImage(file, maxDim=1200, quality=0.85, onProgress){
  return new Promise((resolve,reject)=>{
    const img = new Image(); const reader = new FileReader();
    reader.onload = ()=>{ img.src = reader.result; };
    reader.onerror = reject;
    img.onload = ()=>{
      let {width:w, height:h} = img;
      const ratio = w/h;
      if(Math.max(w,h) > maxDim){
        if(w>h) { w = maxDim; h = Math.round(maxDim/ratio); } else { h = maxDim; w = Math.round(maxDim*ratio); }
      }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      try{
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if(onProgress) onProgress(100);
        resolve(dataUrl);
      }catch(e){ reject(e); }
    };
    reader.readAsDataURL(file);
  });
}

function fakeProgress(ms=600){ return new Promise(res=>{ const el = document.getElementById('uploadProgress'); if(!el) return setTimeout(res, ms); let v=0; const t = setInterval(()=>{ v += Math.random()*18; if(v>=96){ clearInterval(t); el.style.width='100%'; setTimeout(res, 180); } else { el.style.width = Math.floor(v)+'%'; } }, Math.max(20, ms/20)); }); }

function animateCheck(container){
  const el = document.querySelector(container);
  if(!el) return;
  el.innerHTML = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/><path id="check" d="M18 34 L28 44 L46 22" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="80" stroke-dashoffset="80"/></svg>`;
  try{ if(window.gsap) gsap.to('#check',{strokeDashoffset:0,duration:0.6,ease:'power2.out'}); }catch(e){}
}

/* Extract primary color from provided logo and apply as CSS variables across the site */
function applyLogoColors(){
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = 'static/assets/phs_logo.jpg';
  img.onload = ()=>{
    try{
      const canvas = document.createElement('canvas');
      const w = Math.min(160, img.naturalWidth);
      const h = Math.min(160, img.naturalHeight);
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0,0,w,h).data;
      let r=0,g=0,b=0,count=0;
      for(let i=0;i<data.length;i+=4){
        const alpha = data[i+3];
        if(alpha<128) continue;
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
      if(count===0) return;
      r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count);
      const primary = `rgb(${r}, ${g}, ${b})`;
      // compute a secondary by blending toward white for contrast
      const sec = `rgb(${Math.min(255,r+46)}, ${Math.min(255,g+46)}, ${Math.min(255,b+46)})`;
      document.documentElement.style.setProperty('--brand-primary', primary);
      document.documentElement.style.setProperty('--brand-secondary', sec);
      document.documentElement.style.setProperty('--accent', primary);
      document.documentElement.style.setProperty('--accent-2', sec);
      // tint visual-card border or shadow slightly
      document.querySelectorAll('.visual-card, .card').forEach(el=>{ el.style.boxShadow = '0 12px 40px rgba(2,6,23,0.45), 0 0 0 4px rgba(255,255,255,0.02) inset'; });
    }catch(e){ console.warn('Logo color sampling failed', e); }
  };
  img.onerror = ()=>{ /* ignore */ };
}

// logo color sampling disabled to preserve school maroon palette
// applyLogoColors();
