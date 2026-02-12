function initEnhancements(){
	// Allow re-initializing enhancements after dynamic DOM replace. Use per-element guards.
	// Footer year
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	// Nav toggle (mobile)
	const navToggle = document.querySelector('.nav-toggle');
	const nav = document.getElementById('mainNav');
	if (navToggle && nav && !navToggle.dataset._hpInit){
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			nav.classList.toggle('open');
			nav.style.display = nav.classList.contains('open') ? 'flex' : '';
		});
		navToggle.dataset._hpInit = '1';
	}

	// Reveal-on-scroll using IntersectionObserver
	const reveals = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window) {
		const obs = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('show');
					if (window.gsap) {
						try{ gsap.fromTo(entry.target, {opacity:0, y:18}, {opacity:1, y:0, duration:0.8, ease:'power2.out'}); }catch(e){}
					}
					obs.unobserve(entry.target);
				}
			});
		}, {threshold: 0.12});
		reveals.forEach(r => { if(!r.dataset._revealed){ obs.observe(r); r.dataset._revealed = '1'; } });
	} else {
		reveals.forEach(r => r.classList.add('show'));
	}

	// GSAP hero animations (blob float, CTA micro-interactions)
	if (window.gsap) {
		try {
			document.querySelectorAll('.hero-cta .btn').forEach(btn=>{
				if(!btn.dataset._gsapHover){
					btn.addEventListener('mouseenter', ()=> gsap.to(btn,{scale:1.04,duration:0.22}));
					btn.addEventListener('mouseleave', ()=> gsap.to(btn,{scale:1,duration:0.22}));
					btn.dataset._gsapHover = '1';
				}
			});
			gsap.from('.hero-content',{y:26,opacity:0,duration:0.9,delay:0.08,ease:'expo.out'});
			gsap.from('.feature-card',{y:22,opacity:0,stagger:0.12,duration:0.9,delay:0.4,ease:'power2.out'});
		} catch(e) { /* ignore gsap errors */ }
	}

	// Particle background for hero (lightweight)
	function initParticles(){
		const canvas = document.getElementById('heroCanvas');
		if(!canvas) return;
		if(canvas.dataset._hpParticles) return; // already running
		const ctx = canvas.getContext('2d');
		let w = canvas.width = canvas.clientWidth * devicePixelRatio;
		let h = canvas.height = canvas.clientHeight * devicePixelRatio;
		ctx.scale(devicePixelRatio, devicePixelRatio);
		let particles = [];
		const PCOUNT = Math.max(20, Math.floor(window.innerWidth/60));
		function make(){
			particles = [];
			for(let i=0;i<PCOUNT;i++){
				particles.push({
					x: Math.random()*canvas.clientWidth,
					y: Math.random()*canvas.clientHeight,
					r: 1+Math.random()*3,
					vx: (Math.random()-0.5)*0.6,
					vy: (Math.random()-0.5)*0.6,
					alpha: 0.2+Math.random()*0.6
				});
			}
		}
		function resize(){
			w = canvas.width = canvas.clientWidth * devicePixelRatio;
			h = canvas.height = canvas.clientHeight * devicePixelRatio;
			ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
			make();
		}
		function step(){
			ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
			const g = ctx.createLinearGradient(0,0,canvas.clientWidth,canvas.clientHeight);
			g.addColorStop(0,'rgba(122,0,30,0.03)');
			g.addColorStop(1,'rgba(227,178,60,0.02)');
			ctx.fillStyle = g; ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
			for(const p of particles){
				p.x += p.vx; p.y += p.vy;
				if(p.x < -10) p.x = canvas.clientWidth + 10;
				if(p.x > canvas.clientWidth + 10) p.x = -10;
				if(p.y < -10) p.y = canvas.clientHeight + 10;
				if(p.y > canvas.clientHeight + 10) p.y = -10;
				ctx.beginPath();
				ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
				ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
				ctx.fill();
			}
			for(let i=0;i<particles.length;i++){
				for(let j=i+1;j<particles.length;j++){
					const a = particles[i], b = particles[j];
					const dx = a.x-b.x, dy = a.y-b.y, d = Math.sqrt(dx*dx+dy*dy);
					if(d<120){ ctx.strokeStyle = `rgba(227,178,60,${(120-d)/300})`; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
				}
			}
			requestAnimationFrame(step);
		}
		resize(); step();
		canvas.dataset._hpParticles = '1';
		window.addEventListener('resize', ()=>{ clearTimeout(window._hpResize); window._hpResize = setTimeout(resize,220); });
		let mouse = {x:-9999,y:-9999};
		canvas.addEventListener('mousemove', e=>{ const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left); mouse.y = (e.clientY - r.top); for(const p of particles){ const dx=p.x-mouse.x, dy=p.y-mouse.y, dd=Math.sqrt(dx*dx+dy*dy); if(dd<80){ p.vx += (dx/dd)*0.03; p.vy += (dy/dd)*0.03; } } });
		canvas.addEventListener('mouseleave', ()=>{ mouse.x = -9999; mouse.y = -9999; });
	}
	try{ initParticles(); }catch(e){ console.warn('particles failed', e); }

	// Animated counters
	function animateCounter(el, target, duration = 1500) {
		let start = 0;
		const startTime = performance.now();
		function step(now) {
			const t = Math.min((now - startTime) / duration, 1);
			const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
			const value = Math.floor(start + (target - start) * eased);
			el.textContent = value;
			if (t < 1) requestAnimationFrame(step);
			else el.textContent = target;
		}
		requestAnimationFrame(step);
	}

	const counters = document.querySelectorAll('.num[data-target]');
	const countersInit = () => counters.forEach(c => animateCounter(c, parseInt(c.getAttribute('data-target') || '0', 10)));
	if (counters.length) {
		const firstCounter = counters[0];
		if ('IntersectionObserver' in window) {
			const cObs = new IntersectionObserver((entries, observer) => {
				entries.forEach(en => {
					if (en.isIntersecting) {
						countersInit();
						observer.disconnect();
					}
				});
			}, {threshold: 0.2});
			cObs.observe(firstCounter);
		} else {
			countersInit();
		}
	}

	// Simple auto carousel (fades/translates between items)
	const track = document.querySelector('.carousel-track');
	if (track && !track.dataset._carouselInit) {
		track.dataset._carouselInit = '1';
		const items = Array.from(track.children);
		let idx = 0;
		let autoplay = true;
		let interval = null;
		const dotsContainer = document.querySelector('.carousel-dots');
		let slideW = track.parentElement.clientWidth;
		function updateSlideWidth(){ slideW = track.parentElement.clientWidth; }
		window.addEventListener('resize', ()=> { clearTimeout(window._carouselResize); window._carouselResize = setTimeout(()=> { updateSlideWidth(); go(idx); }, 180); });

		function updateDots(){ if(!dotsContainer) return; dotsContainer.innerHTML = items.map((_,i)=>`<button class="carousel-dot" data-index="${i}" aria-label="Go to slide ${i+1}"></button>`).join(''); Array.from(dotsContainer.children).forEach(b=> b.addEventListener('click', e=>{ stop(); go(parseInt(e.currentTarget.dataset.index,10)); })); setActiveDot(); }
		function setActiveDot(){ if(!dotsContainer) return; Array.from(dotsContainer.children).forEach((d,i)=> d.classList.toggle('active', i===idx)); }
		function go(i){ idx = (i + items.length) % items.length; const px = -idx * slideW;
			if(window.gsap){ try{ gsap.to(track, { x: px, duration: 0.6, ease: 'power3.out' }); }catch(e){ track.style.transform = `translateX(${px}px)`; } }
			else { track.style.transform = `translateX(${px}px)`; }
			setActiveDot(); }
		function start(){ stop(); interval = setInterval(()=> go(idx+1), 4200); autoplay = true; }
		function stop(){ if(interval){ clearInterval(interval); interval = null; } autoplay = false; }
		updateDots(); start();
		const prev = document.querySelector('.carousel-prev');
		const next = document.querySelector('.carousel-next');
		if(prev) prev.addEventListener('click', ()=>{ stop(); go(idx-1); });
		if(next) next.addEventListener('click', ()=>{ stop(); go(idx+1); });
		const carousel = track.closest('.carousel');
		if(carousel){
			carousel.addEventListener('mouseenter', ()=> stop());
			carousel.addEventListener('mouseleave', ()=> { if(!interval) start(); });
		}
		(function addSwipe(){
			let startX = 0, isDown = false, base = 0;
			function setTransform(px){ if(window.gsap){ try{ gsap.set(track, { x: px }); }catch(e){ track.style.transform = `translateX(${px}px)`; } } else { track.style.transform = `translateX(${px}px)`; } }
			track.addEventListener('pointerdown', (e)=>{ isDown = true; startX = e.clientX; base = -idx * slideW; track.setPointerCapture && track.setPointerCapture(e.pointerId); track.classList.add('dragging'); });
			track.addEventListener('pointermove', (e)=>{ if(!isDown) return; const dx = e.clientX - startX; setTransform(base + dx); });
			track.addEventListener('pointerup', (e)=>{ if(!isDown) return; isDown=false; track.classList.remove('dragging'); const dx = e.clientX - startX; if(Math.abs(dx) > Math.min(80, slideW*0.18)){ stop(); if(dx < 0) go(idx+1); else go(idx-1); } else { go(idx); } });
			track.addEventListener('pointercancel', ()=>{ if(isDown){ isDown=false; track.classList.remove('dragging'); go(idx); } });
		})();
	}

	// Accessibility: allow reveal items to be focusable when shown
	if(!document.body.dataset._hpKeyInit){
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Tab') {
				document.body.classList.add('keyboard-nav');
			}
		});
		document.body.dataset._hpKeyInit = '1';
	}
}

// expose so router can re-run enhancements after restoring static markup
window.initEnhancements = initEnhancements;
document.addEventListener('DOMContentLoaded', initEnhancements);


