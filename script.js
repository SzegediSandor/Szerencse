/* =========================================================
   1. NYERŐGÉP
   ========================================================= */
(function(){
  "use strict";

  var TIERS = [
    { p: 0.001, mult: 100, key: "jackpot" },
    { p: 0.010, mult: 8,   key: "medium"  },
    { p: 0.360, mult: 2,   key: "small"   },
    { p: 0.629, mult: 0,   key: "none"    }
  ];

  function rollTier(){
    var r = Math.random();
    var acc = 0;
    for (var i = 0; i < TIERS.length; i++){
      acc += TIERS[i].p;
      if (r < acc) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  var OFFSYMS = ["⭐","🍋","🍇","🍀"];

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function symbolsFor(tier){
    if (tier.key === "jackpot") return ["7️⃣","7️⃣","7️⃣"];
    if (tier.key === "medium")  return ["🔔","🔔","🔔"];
    if (tier.key === "small")   return ["🍒","🍒","🍒"];
    if (Math.random() < 0.5){
      var s = pick(["🍒","🔔"]);
      var off = pick(OFFSYMS);
      var res = [s, s, off];
      for (var i = res.length - 1; i > 0; i--){
        var j = Math.floor(Math.random()*(i+1));
        var t = res[i]; res[i] = res[j]; res[j] = t;
      }
      return { arr: res, nearMiss: true };
    }
    return { arr: [pick(OFFSYMS), pick(OFFSYMS), pick(OFFSYMS)], nearMiss: false };
  }

  var START_BALANCE = 20;
  var state = {
    balance: START_BALANCE,
    spins: 0,
    staked: 0,
    won: 0
  };

  var el = {
    reel0: document.getElementById("reel0"),
    reel1: document.getElementById("reel1"),
    reel2: document.getElementById("reel2"),
    spinBtn: document.getElementById("spinBtn"),
    msg: document.getElementById("msg"),
    balance: document.getElementById("statBalance"),
    spins: document.getElementById("statSpins"),
    staked: document.getElementById("statStaked"),
    won: document.getElementById("statWon"),
    resetBtn: document.getElementById("resetBtn")
  };

  function renderStats(){
    el.balance.textContent = state.balance;
    el.spins.textContent = state.spins;
    el.staked.textContent = state.staked;
    el.won.textContent = state.won;
  }

  function setReels(arr){
    el.reel0.textContent = arr[0];
    el.reel1.textContent = arr[1];
    el.reel2.textContent = arr[2];
  }

  function doSpin(){
    if (state.balance < 1){
      el.msg.textContent = "Elfogytak a zsetonjaid — pontosan ez a lényeg.";
      el.spinBtn.disabled = true;
      return;
    }
    el.spinBtn.disabled = true;
    [el.reel0, el.reel1, el.reel2].forEach(function(r){ r.classList.add("spin"); });

    var tier = rollTier();
    var symResult = symbolsFor(tier);
    var arr = symResult.arr ? symResult.arr : symResult;

    state.balance -= 1;
    state.staked += 1;
    state.spins += 1;

    setTimeout(function(){
      setReels(arr);
      [el.reel0, el.reel1, el.reel2].forEach(function(r){ r.classList.remove("spin"); });

      var payout = tier.mult;
      state.balance += payout;
      state.won += payout;
      renderStats();

      if (tier.key === "jackpot"){
        el.msg.textContent = "Főnyeremény! Ez 1000-ből kb. egyszer fordul elő.";
        el.msg.className = "msg win";
      } else if (tier.key === "medium"){
        el.msg.textContent = "Szép nyeremény — de ez a ritka eset, nem a szabály.";
        el.msg.className = "msg win";
      } else if (tier.key === "small"){
        el.msg.textContent = "Kis nyeremény. Ez tartja életben az érzést, hogy „megy ez”.";
        el.msg.className = "msg win";
      } else if (symResult.nearMiss){
        el.msg.textContent = "Majdnem! De ez pontosan ugyanolyan vesztés, mint bármelyik másik.";
        el.msg.className = "msg nearmiss";
      } else {
        el.msg.textContent = "Nincs nyeremény.";
        el.msg.className = "msg";
      }

      el.spinBtn.disabled = state.balance < 1;
      if (state.balance < 1){
        el.msg.textContent += " Elfogytak a zsetonjaid.";
      }
    }, 550);
  }

  el.spinBtn.addEventListener("click", doSpin);

  el.resetBtn.addEventListener("click", function(){
    state = { balance: START_BALANCE, spins: 0, staked: 0, won: 0 };
    renderStats();
    setReels(["🍒","🔔","⭐"]);
    el.msg.textContent = START_BALANCE + " zsetonnal indulsz.";
    el.msg.className = "msg";
    el.spinBtn.disabled = false;
  });

  renderStats();

  /* ---- 1000 pörgetéses szimulációk ---- */
  var simOut = document.getElementById("slotSimOut");

  function simOneSession(spins){
    var net = 0, minNet = 0, maxNet = 0, big = 0, mid = 0;
    for (var i = 0; i < spins; i++){
      var t = rollTier();
      net += t.mult - 1;
      if (t.key === "jackpot") big++;
      if (t.key === "medium") mid++;
      if (net < minNet) minNet = net;
      if (net > maxNet) maxNet = net;
    }
    return { net: net, min: minNet, max: maxNet, big: big, mid: mid };
  }
  function signed(n){ return (n > 0 ? "+" : "") + n; }

  document.getElementById("slotSim1").addEventListener("click", function(){
    var r = simOneSession(1000);
    var txt = "Elköltve: 1000 zseton<br>" +
      "Visszakapva: " + (1000 + r.net) + " zseton<br>" +
      "Nettó eredmény: " + signed(r.net) + " zseton<br>" +
      "Közepes nyeremény: " + r.mid + "×, főnyeremény: " + r.big + "×<br>" +
      "Legmagasabb pont: " + signed(r.max) + ", legmélyebb pont: " + signed(r.min) + "<br><br>";
    if (r.net < 0){
      txt += "A várható érték kb. −100 volt. Futtasd újra: minden alkalommal más jön ki, mert a főnyeremény eltolja az eredményt, de a gép hosszú távon mindig visszahúz.";
    } else {
      txt += "Ezúttal a főnyeremény (vagy a szerencse) mínusz nélkül kihozott. Ez előfordulhat, de ritka. Futtasd újra többször: hosszú távon a gép mindig visszahúz.";
    }
    simOut.innerHTML = txt;
  });
})();


/* =========================================================
   2. RULETT + MARTINGALE
   ========================================================= */
(function(){
  "use strict";

  var RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  var START = 20;

  function isRed(n){ return RED.indexOf(n) > -1; }
  function colorOf(n){ return n === 0 ? "green" : (isRed(n) ? "red" : "black"); }
  var COLOR_HU = { red: "piros", black: "fekete", green: "zöld" };

  var BETS = {
    red:   { pay: 1,  even: true,  t: function(n){ return n > 0 && isRed(n); } },
    black: { pay: 1,  even: true,  t: function(n){ return n > 0 && !isRed(n); } },
    even:  { pay: 1,  even: true,  t: function(n){ return n > 0 && n % 2 === 0; } },
    odd:   { pay: 1,  even: true,  t: function(n){ return n % 2 === 1; } },
    d1:    { pay: 2,  even: false, t: function(n){ return n >= 1  && n <= 12; } },
    d2:    { pay: 2,  even: false, t: function(n){ return n >= 13 && n <= 24; } },
    d3:    { pay: 2,  even: false, t: function(n){ return n >= 25 && n <= 36; } },
    num:   { pay: 35, even: false, t: null }
  };

  var state = { balance: START, spins: 0, staked: 0, won: 0 };
  var betType = "red";
  var stake = 1;

  var ball = document.getElementById("rBall");
  var msg = document.getElementById("rMsg");
  var spinBtn = document.getElementById("rSpin");
  var numInput = document.getElementById("rNum");
  var stakeBtns = document.querySelectorAll("#rStakes .bet-btn");
  var betBtns = document.querySelectorAll("#rBets .bet-btn");

  function render(){
    document.getElementById("rBalance").textContent = state.balance;
    document.getElementById("rSpins").textContent = state.spins;
    document.getElementById("rStaked").textContent = state.staked;
    document.getElementById("rWon").textContent = state.won;
  }

  function activate(list, btn){
    for (var i = 0; i < list.length; i++) list[i].classList.remove("active");
    btn.classList.add("active");
  }

  Array.prototype.forEach.call(stakeBtns, function(b){
    b.addEventListener("click", function(){
      stake = parseInt(b.getAttribute("data-stake"), 10);
      activate(stakeBtns, b);
    });
  });
  Array.prototype.forEach.call(betBtns, function(b){
    b.addEventListener("click", function(){
      betType = b.getAttribute("data-bet");
      activate(betBtns, b);
      var showNum = betType === "num";
      numInput.hidden = !showNum;
      numInput.disabled = !showNum;
      if (showNum) numInput.focus();
    });
  });

  function spin(){
    if (state.balance < stake){
      msg.textContent = state.balance < 1
        ? "Elfogytak a zsetonjaid — pontosan ez a lényeg."
        : "Nincs elég zsetonod ennyi tétre. Válassz kisebbet.";
      msg.className = "msg";
      return;
    }
    var chosen = parseInt(numInput.value, 10);
    if (betType === "num" && (isNaN(chosen) || chosen < 0 || chosen > 36)){
      msg.textContent = "Egy számra tételhez írj be 0 és 36 közötti számot.";
      msg.className = "msg";
      return;
    }

    spinBtn.disabled = true;
    ball.classList.add("spin");
    state.balance -= stake;
    state.staked += stake;
    state.spins += 1;

    var n = Math.floor(Math.random() * 37);
    var bet = BETS[betType];
    var win = betType === "num" ? (n === chosen) : bet.t(n);

    setTimeout(function(){
      ball.classList.remove("spin");
      ball.textContent = n;
      ball.className = "r-ball " + colorOf(n);

      var ret = win ? stake * (bet.pay + 1) : 0;
      state.balance += ret;
      state.won += ret;
      render();

      var where = "A golyó a " + n + "-n állt meg (" + COLOR_HU[colorOf(n)] + "). ";
      if (win){
        msg.textContent = where + "Nyertél! +" + (ret - stake) + " zseton.";
        msg.className = "msg win";
      } else if (n === 0 && bet.even){
        msg.textContent = where + "A nulla minden piros/fekete és páros/páratlan tétet elvisz. Ez a ház 2,7%-a.";
        msg.className = "msg nearmiss";
      } else {
        msg.textContent = where + "Nincs nyeremény.";
        msg.className = "msg";
      }

      spinBtn.disabled = state.balance < 1;
      if (state.balance < 1) msg.textContent += " Elfogytak a zsetonjaid.";
    }, 550);
  }

  spinBtn.addEventListener("click", spin);

  document.getElementById("rReset").addEventListener("click", function(){
    state = { balance: START, spins: 0, staked: 0, won: 0 };
    render();
    ball.textContent = "?";
    ball.className = "r-ball";
    msg.textContent = START + " zsetonnal indulsz.";
    msg.className = "msg";
    spinBtn.disabled = false;
  });

  render();

  /* ---- Martingale szimuláció ---- */
  var mgBtn = document.getElementById("mgBtn");
  var mgOut = document.getElementById("mgOut");

  mgBtn.addEventListener("click", function(){
    var N = 1000, goal = 0, bust = 0, other = 0, total = 0;
    for (var i = 0; i < N; i++){
      var bal = 20, bet = 1, rounds = 0;
      while (bal > 0 && bal < 30 && rounds < 1000){
        var b = Math.min(bet, bal);
        rounds++;
        if (Math.random() < 18 / 37){ bal += b; bet = 1; }
        else { bal -= b; bet *= 2; }
      }
      if (bal >= 30) goal++;
      else if (bal <= 0) bust++;
      else other++;
      total += bal - 20;
    }
    var avg = Math.round(total / N * 10) / 10;
    var txt = "A +10-et elérte: " + goal + " játékos (" + Math.round(goal / N * 100) + "%)<br>" +
              "Mindent elvesztett: " + bust + " játékos (" + Math.round(bust / N * 100) + "%)<br>";
    if (other > 0) txt += "Még játékban: " + other + "<br>";
    txt += "Átlagos eredmény játékosonként: " + (avg > 0 ? "+" : "") + String(avg).replace(".", ",") + " zseton<br>";
    if (avg < 0){
      txt += "<br>A legtöbben nyertek egy kicsit — de a ritka teljes bukás olyan sokba kerül, hogy az átlag mégis mínuszban van.";
    } else {
      txt += "<br>Ezúttal a szerencse kedvezett, de futtasd újra: hosszú távon az átlag mínuszba húz.";
    }
    mgOut.innerHTML = txt;
  });
})();


/* =========================================================
   3. BLACKJACK
   ========================================================= */
(function(){
  "use strict";

  var START = 200;
  var SUITS = ["♠","♥","♦","♣"];
  var RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  var DECKS = 6;

  var shoe = [], running = 0;
  var bal = START, hands = 0, staked = 0, won = 0;
  var bet = 10, ratio = 1.5;
  var phase = "idle";          // "idle" | "play"
  var player = [], dealer = [], hidden = false, doubled = false;

  var $ = function(id){ return document.getElementById(id); };
  var elDealer = $("bjDealer"), elPlayer = $("bjPlayer");
  var elDV = $("bjDealerVal"), elPV = $("bjPlayerVal");
  var btnHit = $("bjHit"), btnStand = $("bjStand"), btnDouble = $("bjDouble"), btnDeal = $("bjDeal");
  var msg = $("bjMsg"), hintBox = $("bjHint"), countBox = $("bjCount");
  var hintOn = $("bjHintOn"), countOn = $("bjCountOn");
  var stakeBtns = document.querySelectorAll("#bjStakes .bet-btn");
  var payBtns = document.querySelectorAll("#bjPay .bet-btn");

  function newShoe(){
    shoe = [];
    for (var d = 0; d < DECKS; d++)
      for (var s = 0; s < 4; s++)
        for (var r = 0; r < 13; r++)
          shoe.push({ r: RANKS[r], s: SUITS[s] });
    for (var i = shoe.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = shoe[i]; shoe[i] = shoe[j]; shoe[j] = t;
    }
    running = 0;
  }

  function cval(c){
    if (c.r === "A") return 11;
    if (c.r === "10" || c.r === "J" || c.r === "Q" || c.r === "K") return 10;
    return parseInt(c.r, 10);
  }
  function hilo(c){
    var v = cval(c);
    if (c.r === "A" || v === 10) return -1;
    if (v <= 6) return 1;
    return 0;
  }
  function info(h){
    var sum = 0, aces = 0;
    for (var i = 0; i < h.length; i++){
      sum += cval(h[i]);
      if (h[i].r === "A") aces++;
    }
    while (sum > 21 && aces > 0){ sum -= 10; aces--; }
    return { t: sum, soft: aces > 0 };
  }
  function draw(){ return shoe.pop(); }
  function see(c){ running += hilo(c); }

  function cardEl(c, back){
    var d = document.createElement("div");
    if (back){ d.className = "card back"; d.textContent = "?"; return d; }
    d.className = "card" + ((c.s === "♥" || c.s === "♦") ? " red" : "");
    d.innerHTML = "<span>" + c.r + "</span><span>" + c.s + "</span>";
    return d;
  }

  function advice(){
    var p = info(player), d = cval(dealer[0]);
    var can2 = player.length === 2 && bal >= bet;
    var t = p.t, a;
    if (p.soft){
      if (t >= 19) a = "stand";
      else if (t === 18){
        if (d >= 3 && d <= 6) a = can2 ? "double" : "stand";
        else if (d === 2 || d === 7 || d === 8) a = "stand";
        else a = "hit";
      }
      else if (t === 17) a = (d >= 3 && d <= 6) ? "double" : "hit";
      else if (t >= 15) a = (d >= 4 && d <= 6) ? "double" : "hit";
      else a = (d >= 5 && d <= 6) ? "double" : "hit";
    } else {
      if (t >= 17) a = "stand";
      else if (t >= 13) a = d <= 6 ? "stand" : "hit";
      else if (t === 12) a = (d >= 4 && d <= 6) ? "stand" : "hit";
      else if (t === 11) a = d <= 10 ? "double" : "hit";
      else if (t === 10) a = d <= 9 ? "double" : "hit";
      else if (t === 9) a = (d >= 3 && d <= 6) ? "double" : "hit";
      else a = "hit";
    }
    if (a === "double" && !can2) a = "hit";
    return a;
  }

  function render(){
    elDealer.innerHTML = "";
    elPlayer.innerHTML = "";
    dealer.forEach(function(c, i){ elDealer.appendChild(cardEl(c, hidden && i === 1)); });
    player.forEach(function(c){ elPlayer.appendChild(cardEl(c, false)); });

    if (dealer.length){
      elDV.textContent = hidden ? "(" + cval(dealer[0]) + " + ?)" : "(" + info(dealer).t + ")";
    } else elDV.textContent = "";
    elPV.textContent = player.length ? "(" + info(player).t + (info(player).soft && info(player).t < 21 ? " lágy" : "") + ")" : "";

    $("bjBalance").textContent = bal;
    $("bjHands").textContent = hands;
    $("bjStaked").textContent = staked;
    $("bjWon").textContent = won;

    var playing = phase === "play";
    btnHit.disabled = !playing;
    btnStand.disabled = !playing;
    btnDouble.disabled = !(playing && player.length === 2 && bal >= bet);
    btnDeal.disabled = playing || bal < bet;
    Array.prototype.forEach.call(stakeBtns, function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(payBtns, function(b){ b.disabled = playing; });

    // tipp
    if (hintOn.checked && playing){
      var a = advice();
      var txt = { hit: "kérj lapot", stand: "állj meg", "double": "duplázz" }[a];
      hintBox.hidden = false;
      hintBox.textContent = "Alapstratégia-tipp: " + txt + ".";
    } else if (hintOn.checked){
      hintBox.hidden = false;
      hintBox.textContent = "Alapstratégia-tipp: indíts egy leosztást, és megmondom, mit lépne a matematikailag optimális játékos.";
    } else hintBox.hidden = true;

    // számolás
    if (countOn.checked){
      var decksLeft = Math.max(shoe.length / 52, 0.5);
      var tc = running / decksLeft;
      countBox.hidden = false;
      countBox.innerHTML =
        "Futó szám: <b class='mono'>" + (running > 0 ? "+" : "") + running + "</b> &nbsp;·&nbsp; " +
        "Hátralévő paklik: <b class='mono'>" + decksLeft.toFixed(1).replace(".", ",") + "</b> &nbsp;·&nbsp; " +
        "Valódi szám: <b class='mono'>" + (tc > 0 ? "+" : "") + tc.toFixed(1).replace(".", ",") + "</b>" +
        "<small>Minél magasabb a valódi szám, annál több nagy lap maradt a pakliban, ami a játékosnak kedvez. Kb. +1–2 fölött emelnének tétet a számolók — a kaszinó pedig pont a hirtelen tétemelést figyeli.</small>";
    } else countBox.hidden = true;
  }

  function settle(){
    hidden = false;
    var pv = info(player).t, dv = info(dealer).t;
    var wager = bet * (doubled ? 2 : 1);
    var pbj = player.length === 2 && pv === 21 && !doubled;
    var dbj = dealer.length === 2 && dv === 21;
    var ret = 0, text, cls = "msg";

    if (pbj && dbj){ ret = wager; text = "Mindkettőtöknek blackjackje van — döntetlen."; }
    else if (pbj){
      var bonus = Math.round(wager * ratio);
      ret = wager + bonus;
      text = "Blackjack! +" + bonus + " zseton.";
      if (ratio === 1.2) text += " A 6:5 miatt " + Math.round(wager * 0.3) + " zsetonnal kevesebb, mint 3:2-nél.";
      cls = "msg win";
    }
    else if (dbj){ text = "Az osztónak blackjackje van."; }
    else if (pv > 21){ text = "Túlléptél a 21-en."; }
    else if (dv > 21){ ret = wager * 2; text = "Az osztó túllépett. Nyertél! +" + wager + " zseton."; cls = "msg win"; }
    else if (pv > dv){ ret = wager * 2; text = "Nyertél! +" + wager + " zseton."; cls = "msg win"; }
    else if (pv === dv){ ret = wager; text = "Döntetlen, a tétet visszakapod."; }
    else { text = "Az osztó nyert (" + dv + " a " + pv + " ellen)."; }

    bal += ret;
    won += ret;
    phase = "idle";
    msg.textContent = text;
    msg.className = cls;
    if (bal < bet) msg.textContent += bal < 1 ? " Elfogytak a zsetonjaid." : " Nincs elég zsetonod erre a tétre.";
    render();
  }

  function reveal(){
    hidden = false;
    see(dealer[1]);
  }

  function dealerPlay(){
    reveal();
    while (info(dealer).t < 17){
      var c = draw(); dealer.push(c); see(c);
    }
    settle();
  }

  function deal(){
    if (bal < bet) return;
    if (shoe.length < DECKS * 52 * 0.25){
      newShoe();
    }
    bal -= bet; staked += bet; hands++;
    doubled = false;
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    hidden = true;
    see(player[0]); see(player[1]); see(dealer[0]);
    msg.className = "msg";
    msg.textContent = "";
    phase = "play";

    var pbj = info(player).t === 21;
    var dbj = info(dealer).t === 21;
    if (pbj || dbj){
      reveal();
      settle();
      return;
    }
    render();
  }

  function hit(){
    var c = draw(); player.push(c); see(c);
    var t = info(player).t;
    if (t > 21){ reveal(); settle(); }
    else if (t === 21){ dealerPlay(); }
    else render();
  }
  function stand(){ dealerPlay(); }
  function dbl(){
    if (!(player.length === 2 && bal >= bet)) return;
    bal -= bet; staked += bet; doubled = true;
    var c = draw(); player.push(c); see(c);
    if (info(player).t > 21){ reveal(); settle(); }
    else dealerPlay();
  }

  btnDeal.addEventListener("click", deal);
  btnHit.addEventListener("click", hit);
  btnStand.addEventListener("click", stand);
  btnDouble.addEventListener("click", dbl);
  hintOn.addEventListener("change", render);
  countOn.addEventListener("change", render);

  function activate(list, btn){
    Array.prototype.forEach.call(list, function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
  }
  Array.prototype.forEach.call(stakeBtns, function(b){
    b.addEventListener("click", function(){
      bet = parseInt(b.getAttribute("data-stake"), 10);
      activate(stakeBtns, b);
      render();
    });
  });
  Array.prototype.forEach.call(payBtns, function(b){
    b.addEventListener("click", function(){
      ratio = parseFloat(b.getAttribute("data-ratio"));
      activate(payBtns, b);
    });
  });

  $("bjReset").addEventListener("click", function(){
    bal = START; hands = 0; staked = 0; won = 0;
    player = []; dealer = []; hidden = false; phase = "idle";
    newShoe();
    msg.textContent = START + " zsetonnal indulsz.";
    msg.className = "msg";
    render();
  });

  newShoe();
  render();
})();
