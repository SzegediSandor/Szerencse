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

/* =========================================================
   4. KOCKAJÁTÉK (Kingdom Come: Deliverance 2 „Dice” stílusban)
   ========================================================= */
(function(){
  "use strict";

  // DICE-CORE-START
  // ---------------------------------------------------------------
  //  A KOCKAJÁTÉK SZABÁLYAI (itt még semmi sem nyúl a weboldalhoz)
  //  Kocka értékek: 1–6.
  // ---------------------------------------------------------------
  var DICE_COUNT = 6;
  var SUSPICION = 0.08;                        // cinkelt kockánál dobásonként ennyi eséllyel buksz le
  // A cinkelt kocka: 8 „oldala” van, az 1-es és az 5-ös kétszer akkora eséllyel jön, mint a többi.
  var LOADED_FACES = [1, 1, 5, 5, 2, 3, 4, 6];

  function randInt(n){ return Math.floor(Math.random() * n); }

  // Egy kocka dobása. set: "fair" (tisztességes) vagy "loaded" (cinkelt).
  function rollFace(set){
    return (set === "loaded") ? LOADED_FACES[randInt(LOADED_FACES.length)] : 1 + randInt(6);
  }

  // ---------------------------------------------------------------
  //  JELVÉNYEK (mindenkinek legfeljebb egy lehet)
  //    "lucky"   – Szerencsehozó: a leadott körpontokat BOOST aránnyal megnöveli
  //    "net"     – Mentőöv: egyszer megmenti a körpontokat, ha elbukod a dobást
  //    "counter" – Hatástalanító: az ellenfél jelvénye nem működik
  // ---------------------------------------------------------------
  var BOOST = 0.15;

  // A Szerencsehozó bónusza a leadott pontokra (5-re kerekítve). 0, ha nincs jelvény, vagy az ellenfél hatástalanítja.
  function boostBonus(pts, mine, theirs){
    if (mine !== "lucky" || theirs === "counter") return 0;
    return Math.round(pts * BOOST / 5) * 5;
  }
  // Működik-e a Mentőöv? (A „már elhasználták-e” kérdést a játék külön követi.)
  function netWorks(mine, theirs){
    return mine === "net" && theirs !== "counter";
  }

  // ---------------------------------------------------------------
  //  PONTOZÁS
  // ---------------------------------------------------------------
  // Hány pontot ér az adott kockacsoport, ha EGYETLEN kombinációt alkot? (0 = nem kombináció)
  //   sima 1-es: 100, sima 5-ös: 50 · hármas vagy több azonos: érték×100 (az 1-es hármas 1000),
  //   minden további azonos kocka duplázza · sorozat: 1–5 = 500, 2–6 = 750, 1–6 = 1500
  function groupScore(vals, sub){
    var counts = [0, 0, 0, 0, 0, 0, 0], size = 0, i;
    for (i = 0; i < vals.length; i++){
      if (sub & (1 << i)){ size++; counts[vals[i]]++; }
    }
    if (size === 1){
      if (counts[1] === 1) return 100;
      if (counts[5] === 1) return 50;
      return 0;
    }
    var best = 0;
    if (size >= 3){                            // azonos kockák (hármas, négyes, ...)
      for (var v = 1; v <= 6; v++){
        if (counts[v] === size){
          var base = (v === 1) ? 1000 : v * 100;
          var s = base * Math.pow(2, size - 3);
          if (s > best) best = s;
        }
      }
    }
    if (size === 5 || size === 6){             // sorozat
      var distinct = true;
      for (i = 1; i <= 6; i++){ if (counts[i] > 1) distinct = false; }
      if (distinct){
        if (size === 6) best = Math.max(best, 1500);
        else {
          if (counts[1] === 0) best = Math.max(best, 750);   // 2–3–4–5–6
          if (counts[6] === 0) best = Math.max(best, 500);   // 1–2–3–4–5
        }
      }
    }
    return best;
  }

  // A kockák legjobb felosztása kombinációkra úgy, hogy MINDEN kocka pontot érjen.
  // 0 = a kijelölés nem érvényes (van benne kocka, ami nem ér pontot).
  var scoreCache = {};
  function scoreOf(values){
    var sorted = values.slice().sort();
    var key = sorted.join("");
    if (scoreCache[key] !== undefined) return scoreCache[key];
    var n = sorted.length, full = (1 << n) - 1;
    var best = [], mask, sub;
    for (mask = 0; mask <= full; mask++) best[mask] = -1;
    best[0] = 0;
    for (mask = 1; mask <= full; mask++){
      var low = mask & -mask;
      for (sub = mask; sub > 0; sub = (sub - 1) & mask){
        if (!(sub & low)) continue;
        var g = groupScore(sorted, sub);
        if (g > 0 && best[mask ^ sub] >= 0 && g + best[mask ^ sub] > best[mask]){
          best[mask] = g + best[mask ^ sub];
        }
      }
    }
    var result = best[full] > 0 ? best[full] : 0;
    scoreCache[key] = result;
    return result;
  }

  // Egy dobás összes lehetséges (érvényes) kijelölése: [{ keep: [értékek], score: pont }, ...]
  // Ha üres, a dobás „bukó”: nincs benne pontot érő kocka.
  var analyzeCache = {};
  function analyze(values){
    var sorted = values.slice().sort();
    var key = sorted.join("");
    if (analyzeCache[key]) return analyzeCache[key];
    var n = sorted.length, seen = {}, list = [];
    for (var mask = 1; mask < (1 << n); mask++){
      var keep = [];
      for (var i = 0; i < n; i++){ if (mask & (1 << i)) keep.push(sorted[i]); }
      var k = keep.join("");
      if (seen[k]) continue;
      seen[k] = true;
      var s = scoreOf(keep);
      if (s > 0) list.push({ keep: keep, score: s });
    }
    analyzeCache[key] = list;
    return list;
  }

  // --- a kockák ("dice" tömb: { v: érték, locked: félre van-e téve }) ---
  function makeDice(){
    var d = [];
    for (var i = 0; i < DICE_COUNT; i++) d.push({ v: 0, locked: false });
    return d;
  }
  function rollFree(dice, set){
    for (var i = 0; i < dice.length; i++){
      if (!dice[i].locked) dice[i].v = rollFace(set);
    }
  }
  function freeValues(dice){
    var out = [];
    for (var i = 0; i < dice.length; i++){ if (!dice[i].locked) out.push(dice[i].v); }
    return out;
  }
  // A megtartandó értékekhez kikeresi, melyik kockákat kell félretenni (a legkisebb sorszámúakat).
  function pickDice(dice, keepValues){
    var idx = [], used = {};
    for (var k = 0; k < keepValues.length; k++){
      for (var i = 0; i < dice.length; i++){
        if (!dice[i].locked && !used[i] && dice[i].v === keepValues[k]){ used[i] = true; idx.push(i); break; }
      }
    }
    return idx;
  }

  // ---------------------------------------------------------------
  //  AZ ELLENFÉL (és a szimuláció) JÁTÉKOSA
  //  hold[r]: mennyit ér, ha a megtartás után r kocka marad a dobáshoz
  //  bank[r]: ennyi körpont fölött leadja a pontot, ha r kockája maradt
  // ---------------------------------------------------------------
  var BOT = {
    hold: [0, 0, 20, 40, 60, 80, 100],
    bank: [0, 300, 300, 350, 500, 1500, 99999]
  };
  // dönt: melyik kockákat tartsa meg, és megálljon-e (bank)
  function botDecide(rollValues, turnPts, myTotal, oppTotal, target, bot){
    var cands = analyze(rollValues), best = null, bestVal = -1, i;
    for (i = 0; i < cands.length; i++){
      var rem = rollValues.length - cands[i].keep.length;
      if (rem === 0) rem = 6;                              // minden kocka pontot ért: újra mind a 6
      var val = cands[i].score + bot.hold[rem];
      if (myTotal + turnPts + cands[i].score >= target) val += 100000;   // ha ezzel nyer, ez a legjobb
      if (val > bestVal){ bestVal = val; best = cands[i]; }
    }
    var after = turnPts + best.score;
    var left = rollValues.length - best.keep.length;
    var hot = (left === 0);
    var rem2 = hot ? 6 : left;
    var stop;
    if (myTotal + after >= target) stop = true;
    else if (hot) stop = false;
    else {
      var th = bot.bank[rem2];
      // ha az ellenfél már közel a célhoz, érdemes többet kockáztatni
      if (oppTotal + 600 >= target) th = Math.max(th, Math.min(target - myTotal, 1500));
      stop = after >= th;
    }
    return { keep: best.keep, score: best.score, bank: stop, hot: hot };
  }

  // Egy teljes játszma két gép között (a szimulációhoz).
  // cfg: { target, youSet, oppSet, youFirst, youBot, oppBot, suspicion, youBadge, oppBadge }
  // Visszaadja: "you" (te nyertél), "opp" (az ellenfél nyert) vagy "caught" (lebuktál a cinkelt kockával).
  function playBotGame(cfg){
    var total = [0, 0];
    var badge = [cfg.youBadge || "none", cfg.oppBadge || "none"];
    var netUsed = [false, false];
    var turn = cfg.youFirst ? 0 : 1;
    for (var guard = 0; guard < 500; guard++){
      var set = (turn === 0) ? cfg.youSet : cfg.oppSet;
      var bot = (turn === 0) ? cfg.youBot : cfg.oppBot;
      var dice = makeDice(), pts = 0, over = false;
      for (var rolls = 0; rolls < 80 && !over; rolls++){
        rollFree(dice, set);
        if (turn === 0 && set === "loaded" && Math.random() < cfg.suspicion) return "caught";
        var vals = freeValues(dice);
        if (analyze(vals).length === 0){                                 // bukás
          if (pts > 0 && !netUsed[turn] && netWorks(badge[turn], badge[1 - turn])){
            netUsed[turn] = true;                                        // a Mentőöv megmenti a körpontokat
            total[turn] += pts;
            if (total[turn] >= cfg.target) return (turn === 0) ? "you" : "opp";
          }
          over = true; break;                                            // egyébként a körpontok elvesznek
        }
        var d = botDecide(vals, pts, total[turn], total[1 - turn], cfg.target, bot);
        pts += d.score;
        var idx = pickDice(dice, d.keep), i;
        for (i = 0; i < idx.length; i++) dice[idx[i]].locked = true;
        if (d.hot){ for (i = 0; i < dice.length; i++) dice[i].locked = false; }
        if (d.bank){
          total[turn] += pts + boostBonus(pts, badge[turn], badge[1 - turn]);
          if (total[turn] >= cfg.target) return (turn === 0) ? "you" : "opp";
          over = true;
        }
      }
      turn = 1 - turn;
    }
    return "none";
  }
  // DICE-CORE-END

  // ---------------------------------------------------------------
  //  A JÁTÉK MENETE
  // ---------------------------------------------------------------
  var START = 20;
  var $ = function(id){ return document.getElementById(id); };

  var el = {
    tray: $("dcTray"), info: $("dcInfo"), msg: $("dcMsg"),
    you: $("dcYou"), opp: $("dcOpp"), turnPts: $("dcTurnPts"), targetShow: $("dcTargetShow"),
    boxYou: $("dcBoxYou"), boxOpp: $("dcBoxOpp"),
    roll: $("dcRoll"), keepRoll: $("dcKeepRoll"), keepBank: $("dcKeepBank"), newGame: $("dcNew"),
    balance: $("dcBalance"), games: $("dcGames"), staked: $("dcStaked"), won: $("dcWon"),
    lost: $("dcLost"), oppRate: $("dcOppRate"),
    settings: $("dcSettings"), lockNote: $("dcLockNote"),
    badgeYou: $("dcBadgeYou"), badgeOpp: $("dcBadgeOpp"), badgeGain: $("dcBadgeGain")
  };
  var stakeBtns  = document.querySelectorAll("#dcStakes .bet-btn");
  var targetBtns = document.querySelectorAll("#dcTargets .bet-btn");
  var youBtns    = document.querySelectorAll("#dcYouSet .bet-btn");
  var oppBtns    = document.querySelectorAll("#dcOppSet .bet-btn");
  var youBadgeBtns = document.querySelectorAll("#dcYouBadge .bet-btn");
  var oppBadgeBtns = document.querySelectorAll("#dcOppBadge .bet-btn");

  var bal = START, games = 0, staked = 0, won = 0;
  var lostPts = 0;                       // a „még egy dobás” ára: bukásnál elveszett pontok
  var oppDiceN = 0, oppScoringN = 0;     // az ellenfél kockáin hány 1-es/5-ös jött
  var stake = 1, target = 2000, youSet = "fair", oppSet = "fair";
  var youBadge = "none", oppBadge = "none";
  var oppSetting = "none", oppRevealed = false;   // az ellenfél jelvénye: "none" vagy "random" (a játszma elején sorsoljuk)
  var badgeGain = 0;                     // a jelvényekből szerzett pontok (te): bónusz + megmentett pontok
  var BADGE_NAME = { none: "nincs", lucky: "🍀 Szerencsehozó", net: "🛟 Mentőöv", counter: "🚫 Hatástalanító" };
  var ROLL_YOU = 600, ROLL_OPP = 1300;   // a dobás-animáció hossza (ms): az ellenfélé lassabb
  var g = null;                          // az aktuális játszma
  var phase = "idle";                    // idle | start | rolling | select | opp | over
  var sel = [false, false, false, false, false, false];
  var gameId = 0;                        // minden új játszma új azonosítót kap (a régi időzítők így leállnak)
  var curScore = 0;                      // a jelenlegi kijelölés pontja

  // --- kocka kirajzolása (pöttyök egy 3×3-as rácsban) ---
  var PIPS = {
    1: [[2,2]],
    2: [[1,1],[3,3]],
    3: [[1,1],[2,2],[3,3]],
    4: [[1,1],[1,3],[3,1],[3,3]],
    5: [[1,1],[1,3],[2,2],[3,1],[3,3]],
    6: [[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]]
  };
  function faceInto(node, v){
    node.innerHTML = "";
    var p = PIPS[v];
    for (var i = 0; i < p.length; i++){
      var pip = document.createElement("i");
      pip.className = "pip";
      pip.style.gridRow = p[i][0];
      pip.style.gridColumn = p[i][1];
      node.appendChild(pip);
    }
  }

  // a pontkombináció-táblázat kockái (a HTML-ben: data-dice="1 1 1")
  Array.prototype.forEach.call(document.querySelectorAll(".dice-row[data-dice]"), function(row){
    row.getAttribute("data-dice").split(" ").forEach(function(t){
      var d = document.createElement("span");
      d.className = "die mini";
      faceInto(d, parseInt(t, 10));
      row.appendChild(d);
    });
  });

  // --- kirajzolás ---
  function setMsg(text, cls){ el.msg.textContent = text; el.msg.className = cls || "msg"; }

  function renderDice(){
    el.tray.innerHTML = "";
    for (var i = 0; i < DICE_COUNT; i++){
      var d = g ? g.dice[i] : { v: 0, locked: false };
      var rolling = !!g && phase === "rolling" && !d.locked;
      var visible = !!g && (d.locked || (g.shown && phase !== "rolling"));
      var b = document.createElement("button");
      var canSel = (phase === "select" && !d.locked);
      var cls = "die" + (visible ? "" : " blank") + (rolling ? " rolling" : "") + (d.locked ? " locked" : "") +
                (sel[i] ? " selected" : "") + (canSel ? " selectable" : "");
      b.className = cls;
      if (visible) faceInto(b, d.v); else b.textContent = rolling ? "?" : "";
      b.disabled = !canSel;
      b.setAttribute("aria-label", visible ? "Kocka: " + d.v : "Kocka");
      (function(idx){ b.addEventListener("click", function(){ toggle(idx); }); })(i);
      el.tray.appendChild(b);
    }
  }

  function renderBoard(){
    el.you.textContent = g ? g.you : 0;
    el.opp.textContent = g ? g.opp : 0;
    el.turnPts.textContent = g ? g.pts : 0;
    el.targetShow.textContent = target;
    el.boxYou.className = "dice-box" + (g && g.turn === "you" && phase !== "over" ? " active" : "");
    el.boxOpp.className = "dice-box" + (g && g.turn === "opp" && phase !== "over" ? " active" : "");
  }

  // jelvény állapot: kész / elhasználva / hatástalanítva
  function badgeStatus(who){
    var mine = (who === "you") ? youBadge : oppBadge, theirs = (who === "you") ? oppBadge : youBadge;
    if (who === "opp" && !oppRevealed && oppSetting === "random") return "véletlen — a játszma elején derül ki";
    if (mine === "none") return "nincs jelvény";
    var t = BADGE_NAME[mine];
    if (mine === "counter") return t + " — " + (theirs === "none" ? "nincs mit hatástalanítani" : (theirs === "counter" ? "kioltják egymást" : "az ellenfél jelvénye hatástalan"));
    if (theirs === "counter") return t + " — hatástalanítva";
    if (mine === "net") return t + (g && g.netUsed[who] ? " — elhasználva" : " — kész");
    return t + " — aktív";
  }

  function renderStats(){
    el.badgeYou.textContent = badgeStatus("you");
    el.badgeOpp.textContent = badgeStatus("opp");
    el.badgeGain.textContent = badgeGain;
    el.balance.textContent = bal;
    el.games.textContent = games;
    el.staked.textContent = staked;
    el.won.textContent = won;
    el.lost.textContent = lostPts;
    el.oppRate.textContent = oppDiceN ? Math.round(oppScoringN / oppDiceN * 100) + "%" : "–";
  }

  function renderControls(){
    var playing = (phase !== "idle" && phase !== "over");
    el.roll.disabled = (phase !== "start");
    el.newGame.disabled = playing || bal < stake;
    el.newGame.textContent = "Új játszma — " + stake + " zseton";
    if (el.settings) el.settings.classList.toggle("locked", playing);
    if (el.lockNote) el.lockNote.hidden = !playing;
    Array.prototype.forEach.call(stakeBtns,  function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(targetBtns, function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(youBtns,    function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(oppBtns,    function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(youBadgeBtns, function(b){ b.disabled = playing; });
    Array.prototype.forEach.call(oppBadgeBtns, function(b){ b.disabled = playing; });
    if (phase !== "select"){ el.keepRoll.disabled = true; el.keepBank.disabled = true; }
  }

  function render(){ renderDice(); renderBoard(); renderStats(); renderControls(); }

  // --- kijelölés ---
  function selectedIdx(){
    var out = [];
    for (var i = 0; i < DICE_COUNT; i++){ if (sel[i]) out.push(i); }
    return out;
  }
  function updateSel(){
    var vals = [], idx = selectedIdx(), i;
    for (i = 0; i < idx.length; i++) vals.push(g.dice[idx[i]].v);
    curScore = vals.length ? scoreOf(vals) : 0;
    var t;
    if (!vals.length) t = "Jelöld ki a pontot érő kockákat.";
    else if (!curScore) t = "Ez a kijelölés nem érvényes: minden kijelölt kockának pontot kell érnie.";
    else t = "Kijelölve: +" + curScore + " pont. Ha megtartod, a körpontod " + (g.pts + curScore) + " lesz.";
    el.info.textContent = t;
    el.keepRoll.disabled = !(phase === "select" && curScore > 0);
    el.keepBank.disabled = !(phase === "select" && curScore > 0);
  }
  function clearSel(){ sel = [false, false, false, false, false, false]; curScore = 0; }
  function toggle(i){
    if (phase !== "select" || g.dice[i].locked) return;
    sel[i] = !sel[i];
    updateSel();
    renderDice();
  }

  // --- dobás (a te és az ellenfél dobása is) ---
  function doRoll(who, done){
    var id = gameId;
    var set = (who === "you") ? youSet : oppSet;
    phase = "rolling";
    rollFree(g.dice, set);               // az értékek azonnal eldőlnek, csak a kijelzés késik
    renderDice(); renderControls();
    setTimeout(function(){
      if (id !== gameId) return;
      g.shown = true;
      if (who === "opp"){
        for (var i = 0; i < DICE_COUNT; i++){
          if (!g.dice[i].locked){ oppDiceN++; if (g.dice[i].v === 1 || g.dice[i].v === 5) oppScoringN++; }
        }
      }
      phase = (who === "you") ? "select" : "opp";
      renderDice(); renderStats();
      if (who === "you" && set === "loaded" && Math.random() < SUSPICION){ endGame("caught"); return; }
      done();
    }, (who === "opp") ? ROLL_OPP : ROLL_YOU);
  }

  // --- a te köröd ---
  function startTurnYou(){
    g.turn = "you"; g.pts = 0; g.dice = makeDice(); g.shown = false; g.rollsInTurn = 0;
    clearSel();
    phase = "start";
    el.info.textContent = "Dobj a kockákkal!";
    setMsg("Te jössz.");
    render();
  }

  function afterYouRoll(){
    var vals = freeValues(g.dice);
    if (analyze(vals).length === 0){
      var lost = g.pts, id = gameId;
      if (lost > 0 && !g.netUsed.you && netWorks(youBadge, oppBadge)){
        g.netUsed.you = true;                       // Mentőöv: a körpontok nem vesznek el
        g.you += lost; badgeGain += lost;
        g.pts = 0;
        el.info.textContent = "";
        if (g.you >= target){ render(); endGame("win"); return; }
        phase = "over-turn";
        setMsg("Elbuktad, de a 🛟 Mentőöv megmentette a körpontjaidat: +" + lost + " pont a számládra került.", "msg win");
        render();
        setTimeout(function(){ if (id === gameId) startTurnOpp(); }, 2000);
        return;
      }
      lostPts += g.pts;
      g.pts = 0;
      phase = "over-turn";
      setMsg(lost > 0 ? "Elbuktad! Nem volt pontot érő kocka, a körben gyűjtött " + lost + " pontod elveszett."
                      : "Elbuktad! Nem volt pontot érő kocka.", "msg nearmiss");
      el.info.textContent = "";
      render();
      setTimeout(function(){ if (id === gameId) startTurnOpp(); }, 1500);
      return;
    }
    phase = "select";
    clearSel();
    updateSel();
    render();
  }

  function onRoll(){
    if (phase !== "start") return;
    doRoll("you", afterYouRoll);
  }

  function lockSelected(){
    var idx = selectedIdx();
    for (var i = 0; i < idx.length; i++) g.dice[idx[i]].locked = true;
    var all = true;
    for (var j = 0; j < DICE_COUNT; j++){ if (!g.dice[j].locked) all = false; }
    if (all){ for (var k = 0; k < DICE_COUNT; k++) g.dice[k].locked = false; }   // minden kocka pontot ért: újra mind a 6
    return all;
  }

  function keepAndRoll(){
    if (phase !== "select" || curScore <= 0) return;
    g.pts += curScore;
    var hot = lockSelected();
    clearSel();
    if (hot) setMsg("Mind a hat kocka pontot ért — újra dobhatod mind a hatot!", "msg win");
    else setMsg("Körpont: " + g.pts + ". Dobsz a maradék kockákkal.");
    g.shown = false;
    el.info.textContent = "";
    doRoll("you", afterYouRoll);
  }

  function keepAndBank(){
    if (phase !== "select" || curScore <= 0) return;
    g.pts += curScore;
    var bonus = boostBonus(g.pts, youBadge, oppBadge);
    g.you += g.pts + bonus; badgeGain += bonus;
    var gained = g.pts;
    g.pts = 0;
    clearSel();
    el.info.textContent = "";
    if (g.you >= target){ render(); endGame("win"); return; }
    phase = "over-turn";
    setMsg("Leadtad a körpontjaidat: +" + gained + (bonus ? " (+" + bonus + " 🍀 Szerencsehozó bónusz)" : "") + ". Az ellenfél jön.");
    render();
    var id = gameId;
    setTimeout(function(){ if (id === gameId) startTurnOpp(); }, 1500);
  }

  // --- az ellenfél köre ---
  function startTurnOpp(){
    var id = gameId;
    g.turn = "opp"; g.pts = 0; g.dice = makeDice(); g.shown = false; g.rollsInTurn = 0;
    clearSel();
    phase = "opp";
    el.info.textContent = "";
    setMsg("Az ellenfél dob…");
    render();
    setTimeout(function(){ if (id === gameId) oppRoll(); }, 1400);
  }

  function oppRoll(){
    var id = gameId;
    g.rollsInTurn++;
    doRoll("opp", function(){
      var vals = freeValues(g.dice);
      if (analyze(vals).length === 0){
        var lost = g.pts;
        if (lost > 0 && !g.netUsed.opp && netWorks(oppBadge, youBadge)){
          g.netUsed.opp = true;
          g.opp += lost; g.pts = 0;
          if (g.opp >= target){ render(); endGame("lose"); return; }
          phase = "over-turn";
          setMsg("Az ellenfél elbukta, de a 🛟 Mentőöve megmentette a körpontjait: +" + lost + " pont.", "msg nearmiss");
          render();
          setTimeout(function(){ if (id === gameId) startTurnYou(); }, 2200);
          return;
        }
        g.pts = 0;
        phase = "over-turn";
        setMsg(lost > 0 ? "Az ellenfél elbukta a körét (−" + lost + " pont)." : "Az ellenfél elbukta a körét.", "msg win");
        render();
        setTimeout(function(){ if (id === gameId) startTurnYou(); }, 2200);
        return;
      }
      var d = botDecide(vals, g.pts, g.opp, g.you, target, BOT);
      if (g.rollsInTurn > 60) d.bank = true;       // biztonsági határ
      var idx = pickDice(g.dice, d.keep), i;
      clearSel();
      for (i = 0; i < idx.length; i++) sel[idx[i]] = true;
      renderDice();
      setTimeout(function(){
        if (id !== gameId) return;
        g.pts += d.score;
        for (i = 0; i < idx.length; i++) g.dice[idx[i]].locked = true;
        var all = true;
        for (i = 0; i < DICE_COUNT; i++){ if (!g.dice[i].locked) all = false; }
        if (all){ for (i = 0; i < DICE_COUNT; i++) g.dice[i].locked = false; }
        clearSel();
        if (d.bank){
          var obonus = boostBonus(g.pts, oppBadge, youBadge);
          g.opp += g.pts + obonus;
          var gained = g.pts;
          g.pts = 0;
          if (g.opp >= target){ render(); endGame("lose"); return; }
          phase = "over-turn";
          setMsg("Az ellenfél leadta a pontjait: +" + gained + (obonus ? " (+" + obonus + " 🍀 bónusz)" : "") + ". Te jössz.");
          render();
          setTimeout(function(){ if (id === gameId) startTurnYou(); }, 2200);
        } else {
          setMsg("Az ellenfél megtartott " + d.score + " pontot (körpont: " + g.pts + "), és tovább dob" + (all ? " mind a hat kockával" : "") + "…");
          g.shown = false;
          render();
          setTimeout(function(){ if (id === gameId) oppRoll(); }, 1500);
        }
      }, 1900);
    });
  }

  // --- a játszma vége ---
  function endGame(result){
    phase = "over";
    var text, cls = "msg";
    if (result === "win"){
      var r = stake * 2;
      bal += r; won += r;
      text = "Nyertél! +" + stake + " zseton.";
      cls = "msg win";
    } else if (result === "lose"){
      text = "Az ellenfél nyert: −" + stake + " zseton.";
    } else {
      var fine = Math.min(stake, bal);
      bal -= fine; staked += fine;
      text = "Lebuktál! Az ellenfél észrevette a cinkelt kockát: elvesztetted a tétet, és még " + fine + " zseton bírságot is fizetsz.";
      cls = "msg nearmiss";
    }
    if (bal < stake) text += bal < 1 ? " Elfogytak a zsetonjaid." : " Nincs elég zsetonod erre a tétre.";
    el.info.textContent = "";
    setMsg(text, cls);
    render();
  }

  // --- új játszma ---
  function newGame(){
    if (phase !== "idle" && phase !== "over") return;
    if (bal < stake) return;
    gameId++;
    if (oppSetting === "random"){ var pool = ["lucky", "net", "counter"]; oppBadge = pool[randInt(3)]; oppRevealed = true; }
    else { oppBadge = "none"; oppRevealed = true; }
    bal -= stake; staked += stake; games++;
    g = { netUsed: { you: false, opp: false }, you: 0, opp: 0, turn: "you", pts: 0, dice: makeDice(), shown: false, rollsInTurn: 0 };
    if (games % 2 === 1){ startTurnYou(); }        // felváltva kezdtek
    else { startTurnOpp(); }
    setMsg(el.msg.textContent + " Az ellenfél jelvénye: " + (oppBadge === "none" ? "nincs" : BADGE_NAME[oppBadge]) + ".", el.msg.className);
    renderStats();
  }

  el.newGame.addEventListener("click", newGame);
  el.roll.addEventListener("click", onRoll);
  el.keepRoll.addEventListener("click", keepAndRoll);
  el.keepBank.addEventListener("click", keepAndBank);

  // --- beállítások (tét, cél, kockák) ---
  function locked(){ return phase !== "idle" && phase !== "over"; }   // játék közben a beállítások zárva vannak
  function activate(list, btn){
    Array.prototype.forEach.call(list, function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
  }
  Array.prototype.forEach.call(stakeBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; stake = parseInt(b.getAttribute("data-stake"), 10); activate(stakeBtns, b); renderControls(); });
  });
  Array.prototype.forEach.call(targetBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; target = parseInt(b.getAttribute("data-target"), 10); activate(targetBtns, b); renderBoard(); });
  });
  Array.prototype.forEach.call(youBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; youSet = b.getAttribute("data-you"); activate(youBtns, b); });
  });
  Array.prototype.forEach.call(oppBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; oppSet = b.getAttribute("data-opp"); activate(oppBtns, b); });
  });

  Array.prototype.forEach.call(youBadgeBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; youBadge = b.getAttribute("data-ybadge"); activate(youBadgeBtns, b); renderStats(); });
  });
  Array.prototype.forEach.call(oppBadgeBtns, function(b){
    b.addEventListener("click", function(){ if (locked()) return; oppSetting = b.getAttribute("data-obadge"); oppBadge = "none"; oppRevealed = false; activate(oppBadgeBtns, b); renderStats(); });
  });

  $("dcReset").addEventListener("click", function(){
    gameId++;                                   // a futó játszma időzítői leállnak
    bal = START; games = 0; staked = 0; won = 0; lostPts = 0; badgeGain = 0; oppDiceN = 0; oppScoringN = 0;
    g = null; phase = "idle"; clearSel();
    el.info.textContent = "";
    setMsg(START + " zsetonnal indulsz.");
    render();
  });

  // ---------------------------------------------------------------
  //  SZIMULÁCIÓ: 1000 játszma soronként, két egyforma „gép” játszik
  // ---------------------------------------------------------------
  function hu(n, dec){ return n.toFixed(dec).replace("-", "−").replace(".", ","); }

  $("dcSim").addEventListener("click", function(){
    var out = $("dcSimOut");
    out.textContent = "Számolok…";
    setTimeout(function(){
      var N = 2000, TARGET = 2000;
      var scenarios = [
        { name: "Mindkét fél kockája tisztességes, jelvény nélkül", you: "fair",   opp: "fair",   susp: 0 },
        { name: "A te kockád tisztességes, a házé cinkelt",         you: "fair",   opp: "loaded", susp: 0 },
        { name: "A te kockád cinkelt, soha nem buksz le",           you: "loaded", opp: "fair",   susp: 0 },
        { name: "A te kockád cinkelt, dobásonként 8% a lebukás",    you: "loaded", opp: "fair",   susp: SUSPICION },
        { name: "Neked 🍀 Szerencsehozó jelvényed van",             you: "fair",   opp: "fair",   susp: 0, yb: "lucky" },
        { name: "Neked 🛟 Mentőöved van",                           you: "fair",   opp: "fair",   susp: 0, yb: "net" },
        { name: "Neked 🍀 van, az ellenfélnek 🚫 Hatástalanítója",   you: "fair",   opp: "fair",   susp: 0, yb: "lucky", ob: "counter" }
      ];
      var html = "";
      scenarios.forEach(function(sc){
        var w = 0, c = 0;
        for (var i = 0; i < N; i++){
          var r = playBotGame({ target: TARGET, youSet: sc.you, oppSet: sc.opp, youFirst: i % 2 === 0, youBot: BOT, oppBot: BOT, suspicion: sc.susp, youBadge: sc.yb, oppBadge: sc.ob });
          if (r === "you") w++; else if (r === "caught") c++;
        }
        var l = N - w - c;
        var ev = (w - l - 2 * c) / N;              // átlagos eredmény játszmánként, a tét többszöröseként (lebukás = tét + bírság)
        html += sc.name + ":<br>&nbsp;&nbsp;nyert " + Math.round(w / N * 100) + "%" +
                (c ? ", lebukott " + Math.round(c / N * 100) + "%" : "") +
                " · átlag " + (ev > 0 ? "+" : "") + hu(ev, 2) + " tét / játszma<br>";
      });
      html += "<br>Tisztességes kockákkal mindenki esélye kb. 50%. A cinkelt kocka óriási előnyt ad annak, aki használja — de ha te csalsz, a lebukás ára (a tét és a bírság) elviszi a nyereséget. A jelvények kisebb, de érezhető előnyt adnak (néhány százalék), a Hatástalanító pedig kioltja az ellenfél jelvényét. A házat viszont senki nem bünteti, ha cinkelt kockával játszik.";
      out.innerHTML = html;
    }, 30);
  });

  setMsg(START + " zsetonnal indulsz.");
  render();
})();
