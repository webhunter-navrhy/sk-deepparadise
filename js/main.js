// Formulář: demo režim neodesílá nic, ostrý režim posílá na endpoint ze site.json (data-endpoint).
(function () {
  document.querySelectorAll('form.formular').forEach(function (f) {
    var stav = f.querySelector('.formular-stav');
    f.addEventListener('submit', function (e) {
      var endpoint = f.getAttribute('data-endpoint');
      var demo = f.getAttribute('data-demo') === '1';
      if (f.querySelector('.past input').value) { e.preventDefault(); return; }   // robot
      if (demo || !endpoint) {
        e.preventDefault();
        stav.textContent = 'Ukážka formulára: nič sa neodosiela. Po spustení webu príde správa na e-mail firmy.';
        return;
      }
      e.preventDefault();
      stav.textContent = 'Odosielam…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); stav.textContent = 'Ďakujeme, správa bola odoslaná.'; })
        .catch(function () { stav.textContent = 'Odoslanie sa nepodarilo. Napíšte nám prosím e-mailom.'; });
    });
  });
})();

// E-shop: filter, hľadanie, detail, košík (localStorage), ukazovateľ hĺbky
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var karty = $$('.karta');
  var info = {};
  karty.forEach(function (k) {
    var id = k.getAttribute('data-id');
    var img = $('img', k);
    info[id] = { id: id, nazov: $('h3', k).textContent, kat: $('.kat', k).textContent, cena: parseFloat($('.cena', k).textContent.replace(/.*?(\d+)\s*€\s*$/, '$1')), img: img.currentSrc || img.src };
  });
  var popisy = window.__POPISY || {};
  var eur = function (n) { return n.toFixed(2).replace('.', ',').replace(',00', '') + ' €'; };

  // filter + hľadanie
  var kat = '', q = '', vsetko = false;
  var vbtn = $('[data-vsetko]');
  var vysl = $('[data-vysl]'), nic = $('[data-nic]');
  function filtruj() {
    var n = 0, t = q.trim().toLowerCase();
    var skr = !vsetko && !kat && !t;
    karty.forEach(function (k) {
      var ok = (!kat || k.getAttribute('data-kat') === kat) && (!t || k.getAttribute('data-hlad').indexOf(t) > -1) && (!skr || k.hasAttribute('data-top'));
      k.hidden = !ok; if (ok) n++;
    });
    vysl.textContent = (kat || t) ? 'Nájdené produkty: ' + n : '';
    nic.hidden = n > 0;
    vbtn.parentNode.hidden = !skr;
    $('[data-chipy]').hidden = skr;
  }
  $$('[data-chipy] .chip').forEach(function (c) {
    c.addEventListener('click', function () {
      $$('[data-chipy] .chip').forEach(function (x) { x.classList.remove('on'); });
      c.classList.add('on'); kat = c.getAttribute('data-kat'); filtruj();
    });
  });
  vbtn.addEventListener('click', function () { vsetko = true; filtruj(); });
  $$('[data-kat-dl]').forEach(function (d) {
    d.addEventListener('click', function () {
      var c = $('[data-chipy] .chip[data-kat="' + d.getAttribute('data-kat-dl') + '"]'); c.click();
      document.getElementById('produkty').scrollIntoView({ behavior: 'smooth' });
    });
  });
  var f = $('[data-hladat]'), inp = $('input', f);
  f.addEventListener('submit', function (e) { e.preventDefault(); location.hash = '#produkty'; });
  inp.addEventListener('input', function () {
    q = inp.value; filtruj();
    if (q.trim() && location.hash !== '#produkty') document.getElementById('produkty').scrollIntoView({ behavior: 'smooth' });
  });

  // košík
  var kl = 'dp-kosik-ukazka', kosik = {};
  try { kosik = JSON.parse(localStorage.getItem(kl) || '{}'); } catch (e) { kosik = {}; }
  var panel = $('[data-kosik]'), zastor = $('[data-zastor]');
  function uloz() { try { localStorage.setItem(kl, JSON.stringify(kosik)); } catch (e) {} }
  function kresli() {
    var ul = $('[data-kosik-pol]'), spolu = 0, ks = 0;
    ul.innerHTML = '';
    Object.keys(kosik).forEach(function (id) {
      var p = info[id]; if (!p) return;
      var n = kosik[id]; spolu += p.cena * n; ks += n;
      var li = document.createElement('li');
      li.innerHTML = '<img alt="" src="' + p.img + '" width="56" height="56"><div><b></b><span>' + eur(p.cena) + '</span></div><div class="mn"><button type="button" aria-label="Menej">−</button><i>' + n + '</i><button type="button" aria-label="Viac">+</button></div>';
      $('b', li).textContent = p.nazov;
      var b = $$('button', li);
      b[0].onclick = function () { zmen(id, -1); }; b[1].onclick = function () { zmen(id, 1); };
      ul.appendChild(li);
    });
    $('[data-kosik-pocet]').textContent = ks;
    $('[data-kosik-prazdny]').hidden = ks > 0;
    $('[data-kosik-pata]').hidden = ks === 0;
    $('[data-kosik-spolu]').textContent = eur(spolu);
  }
  function zmen(id, d) { kosik[id] = (kosik[id] || 0) + d; if (kosik[id] <= 0) delete kosik[id]; uloz(); kresli(); }
  function otvorKosik() { kresli(); panel.hidden = false; zastor.hidden = false; document.body.classList.add('zamk'); }
  function zavri() {
    panel.hidden = true; zastor.hidden = true; $('[data-detail]').hidden = true; document.body.classList.remove('zamk');
  }
  $('[data-kosik-otvor]').addEventListener('click', otvorKosik);
  $$('[data-zavri]').forEach(function (b) { b.addEventListener('click', zavri); });
  zastor.addEventListener('click', zavri);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zavri(); });
  $$('[data-pridat]').forEach(function (b) {
    b.addEventListener('click', function () {
      zmen(b.getAttribute('data-pridat'), 1);
      b.textContent = 'Pridané ✓'; setTimeout(function () { b.textContent = 'Do košíka'; }, 1200);
    });
  });
  $('[data-objednat]').addEventListener('click', function () { $('[data-demo-poz]').hidden = false; });

  // detail
  var dt = $('[data-detail]'), dId = null;
  function otvorDetail(id) {
    var p = info[id]; if (!p) return; dId = id;
    $('[data-d-obr]').src = p.img; $('[data-d-obr]').alt = p.nazov;
    $('[data-d-kat]').textContent = p.kat; $('[data-d-nazov]').textContent = p.nazov;
    $('[data-d-popis]').textContent = popisy[id] || '';
    $('[data-d-cena]').textContent = eur(p.cena);
    dt.hidden = false; zastor.hidden = false; document.body.classList.add('zamk');
  }
  $$('[data-otvor]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); otvorDetail(b.getAttribute('data-otvor')); });
  });
  $('[data-d-pridat]').addEventListener('click', function () { zmen(dId, 1); zavri(); otvorKosik(); });
  dt.addEventListener('click', function (e) { if (e.target === dt) zavri(); });
  kresli(); filtruj();

  // ukazovateľ hĺbky (dekorácia)
  var h = $('[data-hlbka]'), tick = false;
  function hlbka() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var r = max > 0 ? Math.min(1, scrollY / max) : 0;
    h.textContent = Math.round(r * 40); tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(hlbka); } }, { passive: true });
  hlbka();
})();
