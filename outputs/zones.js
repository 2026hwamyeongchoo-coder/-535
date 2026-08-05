if (!new URLSearchParams(location.search).has('play')) location.replace('index.html');
window.addEventListener('load', () => {
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  scene.traverse((object) => {
    if (object.isHemisphereLight) object.intensity = 0.72;
    if (object.isDirectionalLight) object.intensity = Math.min(object.intensity, 0.85);
  });
  ship.traverse((object) => {
    if (!object.isMesh || !object.material?.color) return;
    const color = object.material.color.getHex();
    if (color === 0xa43831) object.material.color.setHex(0x7d211c);
    if (color === 0x66777b) object.material.color.setHex(0x34474f);
    object.material.needsUpdate = true;
  });
  // Replace the accumulated placeholder pieces with one coherent opaque hull.
  ship.clear();
  ship.userData.cleanHull = true;
  const cleanAdd = (geometry, material, position) => { const mesh = new T.Mesh(geometry, material); mesh.position.set(...position); mesh.castShadow = mesh.receiveShadow = true; ship.add(mesh); return mesh; };
  const hullSteel = new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.43, metalness: 0.32 });
  const deckSteel = new T.MeshStandardMaterial({ color: 0x536b73, roughness: 0.5, metalness: 0.48 });
  const whiteSteel = new T.MeshStandardMaterial({ color: 0xd6e2e3, roughness: 0.42, metalness: 0.45 });
  cleanAdd(new T.BoxGeometry(W * S + 1.0, .46, D * S - 1.2), hullSteel, [0, -3.48, -1.0]);
  [-1, 1].forEach((side) => cleanAdd(new T.BoxGeometry(.5, 3.9, D * S - 1.2), hullSteel, [side * (W * S / 2 + .25), -1.4, -1.0]));
  cleanAdd(new T.BoxGeometry(W * S + .5, 3.9, .5), hullSteel, [0, -1.4, -11.28]);
  const sharpBow = new T.BufferGeometry();
  sharpBow.setAttribute('position', new T.BufferAttribute(new Float32Array([
    -4.75,.36,-1.35, 4.75,.36,-1.35, -4.55,-3.48,-1.35, 4.55,-3.48,-1.35,
    -.42,.26,2.18, .42,.26,2.18, -.16,-2.14,2.18, .16,-2.14,2.18
  ]), 3));
  sharpBow.setIndex([0,1,5,0,5,4, 0,4,6,0,6,2, 1,3,7,1,7,5, 2,6,7,2,7,3, 4,5,7,4,7,6, 0,2,3,0,3,1]);
  sharpBow.computeVertexNormals();
  cleanAdd(sharpBow, new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.43, metalness: 0.32, side: T.DoubleSide }), [0,0,9.55]);
  const deckMesh = cleanAdd(new T.BoxGeometry(W * S + .55, .22, D * S + .6), deckSteel, [0, .48, 0]); deckMesh.userData.keepDeck = true;
  [-1,1].forEach((side) => cleanAdd(new T.BoxGeometry(.18,.7,D*S+.25),whiteSteel,[side*(W*S/2+.26),.82,0]));
  cleanAdd(new T.BoxGeometry(5.4,.65,1.9), whiteSteel, [0, .92, -9.65]);
  cleanAdd(new T.BoxGeometry(4.7,1.55,1.55), whiteSteel, [0, 1.96, -9.65]);
  const bridgeWindows = cleanAdd(new T.BoxGeometry(4.18,.46,.08), new T.MeshStandardMaterial({color:0x123e53,roughness:.18,metalness:.7}), [0, 2.25, -8.84]);
  cleanAdd(new T.BoxGeometry(5.35,.18,2.08), whiteSteel, [0, 2.85, -9.65]);
  for (let z = -10.5; z <= 10.5; z += 1.5) [-1,1].forEach((side) => cleanAdd(new T.BoxGeometry(.05,.5,.05), whiteSteel, [side*(W*S/2+.38),1.32,z]));
  makeGhost();
  const navigationBridge = ship.children.find((object) => object.isGroup && object.children.some((part) => part.geometry?.parameters?.width === 4.6));
  if (navigationBridge) {
    navigationBridge.position.y = 1.52;
    navigationBridge.children.forEach((part) => {
      if (part.isMesh && part.geometry?.parameters?.width === 4.6) part.material = new T.MeshStandardMaterial({ color: 0xc9d7d9, roughness: 0.5, metalness: 0.38 });
    });
    const bridgeBase = new T.Mesh(new T.BoxGeometry(5.0, 0.72, 1.72), new T.MeshStandardMaterial({ color: 0x6f8790, roughness: 0.48, metalness: 0.42 }));
    bridgeBase.position.set(0, 0.87, navigationBridge.position.z); bridgeBase.castShadow = bridgeBase.receiveShadow = true; ship.add(bridgeBase);
    const rearBulkhead = new T.Mesh(new T.BoxGeometry(W * S + 1.2, 2.95, 0.42), new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.42, metalness: 0.32 }));
    rearBulkhead.position.set(0, -1.05, navigationBridge.position.z - 0.92); rearBulkhead.castShadow = rearBulkhead.receiveShadow = true; ship.add(rearBulkhead);
  }
  // Close both longitudinal ends with actual exterior hull faces. The previous
  // model only had side plates, exposing the interior when viewed head-on.
  if (!ship.userData.cleanHull) [-1, 1].forEach((end) => {
    const endWall = new T.Mesh(
      new T.BoxGeometry(W * S + 1.05, 3.05, 0.46),
      new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.42, metalness: 0.32, side: T.DoubleSide })
    );
    endWall.position.set(0, -1.08, end * 11.75);
    endWall.castShadow = endWall.receiveShadow = true;
    ship.add(endWall);
  });
  // Replace the round placeholder bow with a connected, pointed container-ship bow.
  ship.traverse((object) => { if (object.isMesh && object.geometry?.type === 'SphereGeometry') object.visible = false; });
  const bowVertices = new Float32Array([
    -4.62, 0.34, -2.0, 4.62, 0.34, -2.0, -4.35, -2.48, -2.0, 4.35, -2.48, -2.0,
    -0.74, 0.30, 2.16, 0.74, 0.30, 2.16, -0.24, -1.42, 2.16, 0.24, -1.42, 2.16
  ]);
  const bowFaces = [0,1,5,0,5,4, 0,4,6,0,6,2, 1,3,7,1,7,5, 2,6,7,2,7,3, 4,5,7,4,7,6, 0,2,3,0,3,1];
  const bowGeometry = new T.BufferGeometry();
  bowGeometry.setAttribute('position', new T.BufferAttribute(bowVertices, 3)); bowGeometry.setIndex(bowFaces); bowGeometry.computeVertexNormals();
  const pointedBow = new T.Mesh(bowGeometry, new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.42, metalness: 0.32 }));
  pointedBow.position.set(0, 0, 9.7); pointedBow.castShadow = pointedBow.receiveShadow = true; pointedBow.visible = !ship.userData.cleanHull; ship.add(pointedBow);

  function addZone(x, z, w, d, color, label, onDeck = false) {
    const tile = new T.Mesh(new T.BoxGeometry(w * S - 0.12, 0.035, d * S - 0.12), new T.MeshStandardMaterial({ color, transparent: true, opacity: 0.62, emissive: color, emissiveIntensity: 0.25 }));
    tile.position.set((x - (W - 1) / 2 + (w - 1) / 2) * S, onDeck ? 0.61 : -2.82, (z - (D - 1) / 2 + (d - 1) / 2) * S);
    ship.add(tile);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.font = 'bold 24px sans-serif'; context.textAlign = 'center'; context.fillText(label, 128, 39);
    const marker = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(canvas), transparent: true }));
    marker.position.copy(tile.position); marker.position.y = onDeck ? 0.82 : -2.25; marker.scale.set(1.6, 0.4, 1); ship.add(marker);
  }
  addZone(0, 2, 2, 1, 0xe69b27, 'FLAT RACK', true);
  addZone(1, 3, 1, 1, 0x1689e1, 'REEFER ⚡');
  addZone(4, 10, 1, 1, 0x1689e1, 'REEFER ⚡');
  addZone(3, 7, 1, 1, 0x8452a5, 'TANK SAFE');
  addZone(1, 9, 3, 1, 0x333333, 'HEAVY · L1');
  for (let level = 1; level < H; level += 1) {
    const frame = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(W * S + 0.12, 0.01, D * S + 0.12)), new T.LineBasicMaterial({ color: 0x74e5db, transparent: true, opacity: 0.16 }));
    frame.position.y = 0.13 + level * 1.62; ship.add(frame);
  }

  const originalRenderCards = renderCards;
  renderCards = function renderCardsWithCounts() {
    originalRenderCards();
    const totalRemaining = manifest.filter((item) => !item.used).length;
    const remainLabel = document.querySelector('#remain');
    if (remainLabel) remainLabel.textContent = `전체 ${totalRemaining}개`;
    document.querySelectorAll('#cargo .card').forEach((card, index) => {
      const item = manifest[index];
      const count = document.createElement('span');
      // Every row is one physical container, so its count must never imply
      // that the other sizes in the same category are duplicates.
      count.textContent = item.used ? '적재 완료' : '남은 1개';
      count.style.cssText = 'margin-left:auto;align-self:flex-start;padding:2px 5px;border-radius:5px;background:#285d71;color:#fff;font-size:10px;font-weight:800;white-space:nowrap';
      card.append(count);
    });
  };
  renderCards();

  // One inventory row represents a cargo type/size, rather than one row for
  // every single physical box. Selecting it picks the next available unit.
  renderCards = function renderGroupedCargoCards() {
    const cargoList = document.querySelector('#cargo');
    const groups = [];
    manifest.forEach((item, index) => {
      const key = `${item.t}|${item.id}`;
      let group = groups.find((entry) => entry.key === key);
      if (!group) {
        group = { key, item, indexes: [] };
        groups.push(group);
      }
      group.indexes.push(index);
    });
    cargoList.innerHTML = '';
    groups.forEach((group) => {
      const remainingIndexes = group.indexes.filter((index) => !manifest[index].used);
      const remaining = remainingIndexes.length;
      const item = group.item;
      const type = types[item.t];
      const card = document.createElement('div');
      card.className = `card ${remaining === 0 ? 'used' : ''} ${remainingIndexes.includes(chosen) ? 'selected' : ''}`;
      card.innerHTML = `<div class="badge" style="background:#${type.c.toString(16).padStart(6, '0')}">${type.m}</div><div><b>${item.id} · ${type.n}</b><small>${item.sp} · ${type.r}</small></div><span style="margin-left:auto;align-self:flex-start;padding:2px 6px;border-radius:6px;background:#285d71;color:#fff;font-size:11px;font-weight:800;white-space:nowrap">${remaining === 0 ? '적재 완료' : `남은 ${remaining}개`}</span>`;
      card.onclick = () => {
        if (!remaining) return;
        const nextIndex = remainingIndexes[0];
        chosen = chosen === nextIndex ? null : nextIndex;
        manifest[nextIndex].dir = dir;
        if (chosen !== null && item.t === 'flat' && loadArea !== 'deck') {
          loadArea = 'deck';
          areaButton.textContent = '적재 위치: 상갑판';
          updateDeckTransparency();
          toast('플랫랙은 상갑판에만 적재합니다');
        }
        renderCards();
        toast(chosen === null ? '화물 선택 해제' : `${item.id} 적재 위치를 클릭하세요`);
      };
      cargoList.append(card);
    });
    const total = manifest.filter((item) => !item.used).length;
    document.querySelector('#remain').textContent = `전체 ${total}개`;
  };
  renderCards();

  const helpStyle = document.createElement('style');
  helpStyle.textContent = `
    .stow-help-backdrop{position:fixed;inset:0;z-index:20;display:none;place-items:center;background:#020e17a8;padding:20px}
    .stow-help-backdrop.open{display:grid}.stow-help{position:relative;width:min(640px,94vw);max-height:82vh;overflow:auto;border:2px solid #69b8ce;border-radius:16px;background:#082337;color:#eaf8ff;box-shadow:0 18px 50px #000b;padding:24px}
    .stow-help h2{margin:0 34px 12px 0;color:#fff;font-size:23px}.stow-help h3{margin:18px 0 7px;color:#83e7d2;font-size:15px}.stow-help p{margin:4px 0;line-height:1.55;font-size:14px}.stow-help strong{color:#ffd55b}.stow-help-close{position:absolute;right:14px;top:12px;width:34px;height:34px;padding:0;border-radius:50%;font-size:24px;line-height:30px;background:#1d607d}
  `;
  document.head.append(helpStyle);
  const helpBackdrop = document.createElement('div');
  helpBackdrop.className = 'stow-help-backdrop';
  helpBackdrop.innerHTML = `<section class="stow-help" role="dialog" aria-modal="true" aria-labelledby="stow-help-title"><button class="stow-help-close" aria-label="도움말 닫기">×</button><h2 id="stow-help-title">적재 도움말</h2><p>왼쪽 목록에서 화물을 선택한 뒤, 열린 선창의 빈 칸을 클릭해 적재합니다. 드래그로 배를 돌리고 휠로 확대·축소합니다. 40ft 화물은 <strong>40피트 회전</strong>으로 방향을 바꿀 수 있습니다.</p><h3>화물별 적재 가능 위치</h3><p><strong>일반 컨테이너</strong> — 모든 선창과 모든 층에 적재 가능</p><p><strong>플랫랙</strong> — 주황색 <strong>FLAT RACK</strong> 전용 구역 또는 맨 위층</p><p><strong>냉동 컨테이너</strong> — 파란색 <strong>REEFER</strong> 전원 구역 또는 맨 위층</p><p><strong>액체 탱크</strong> — 보라색 <strong>TANK SAFE</strong> 안전 구역 또는 선창 하부 1~2층</p><p><strong>가연성 화물</strong> — 다른 화물의 맨 위층에만 적재</p><p><strong>무거운 화물</strong> — 검은색 <strong>HEAVY L1</strong> 구역의 선창 바닥층</p><h3>안전 규칙</h3><p>컨테이너는 아래 화물 전체가 받쳐야 합니다. 좌우 무게중심 게이지가 중앙의 녹색 구간에 머물도록 양쪽에 나누어 적재하세요. 규칙 위반이나 심한 기울기는 게임 오버입니다.</p></section>`;
  [...helpBackdrop.querySelectorAll('p')].find((paragraph) => paragraph.textContent.startsWith('냉동 컨테이너')).innerHTML = '<strong>냉동 컨테이너</strong> — 선창 내부의 파란색 <strong>REEFER ⚡</strong> 전원 구역 또는 상갑판의 외부 적재 위치';
  document.body.append(helpBackdrop);
  const closeHelp = () => helpBackdrop.classList.remove('open');
  helpBackdrop.querySelector('.stow-help-close').onclick = closeHelp;
  document.querySelector('#help').onclick = () => helpBackdrop.classList.add('open');
  const restartButton = document.querySelector('#again');
  restartButton.textContent = '새 항차 시작';
  const titleButton = document.createElement('button');
  titleButton.textContent = '타이틀 화면';
  titleButton.style.marginLeft = '8px';
  titleButton.onclick = () => { location.href = 'index.html'; };
  restartButton.insertAdjacentElement('afterend', titleButton);

  const menuStyle = document.createElement('style');
  menuStyle.textContent = `.cargo-main-menu{position:fixed;z-index:30;inset:0;display:grid;place-items:center;background:linear-gradient(90deg,#031928e8,#082c3d9c,#00111dcc);transition:opacity .35s}.cargo-main-menu.hide{opacity:0;pointer-events:none}.cargo-main-card{width:min(540px,90vw);padding:38px;border:2px solid #74c6df;border-radius:22px;background:linear-gradient(145deg,#0b3349ed,#041827ef);box-shadow:0 24px 70px #000c;text-align:center}.cargo-main-card .anchor{font-size:52px}.cargo-main-card h1{font-size:43px;line-height:.86;letter-spacing:-.07em;margin:10px 0}.cargo-main-card h1 span{font-size:19px;color:#ffd34d;letter-spacing:.12em}.cargo-main-card p{color:#c3e1ea;line-height:1.6;margin:19px auto;max-width:420px}.cargo-main-card button{font-size:19px;padding:14px 35px;background:linear-gradient(135deg,#1b9ec8,#12618c);box-shadow:0 5px 0 #063b59}.cargo-main-card small{display:block;color:#8fb6c3;margin-top:18px}`;
  document.head.append(menuStyle);
  const mainMenu = document.createElement('div');
  mainMenu.className = 'cargo-main-menu';
  mainMenu.innerHTML = `<main class="cargo-main-card"><div class="anchor">⚓</div><h1>CARGO<br>MASTER<br><span>3D STOWAGE PUZZLE</span></h1><p>실제 컨테이너선의 하부 선창과 상갑판에 화물을 적재하세요. 공간 효율, 화물 규칙, 무게 균형을 모두 지켜야 합니다.</p><button id="start-game">게임 시작</button><small>마우스 드래그: 시점 회전 · 휠: 확대/축소</small></main>`;
  document.body.append(mainMenu);
  document.querySelector('#start-game').onclick = () => { mainMenu.classList.add('hide'); setTimeout(() => mainMenu.remove(), 400); toast('작업 지시가 도착했습니다. 안전하게 적재하세요.'); };
  // The playable file opens directly to the game. Its title screen lives in
  // the separate landing page, which links here through the start button.
  mainMenu.remove();

  const compactUiStyle = document.createElement('style');
  compactUiStyle.textContent = `.hud{top:12px;left:12px;width:180px;gap:7px}.right{top:12px;right:12px;width:220px;gap:7px}.panel{padding:10px;border-radius:10px}.brand b{font-size:25px}h1{font-size:22px}.brand h1 span{font-size:12px;margin-top:5px}.stats{gap:6px}.stat b{font-size:18px}.goal{font-size:11px;line-height:1.55}.cargo{max-height:340px;gap:5px}.card{padding:6px;gap:6px}.card b{font-size:11px}.card small{font-size:9px}.badge{width:28px;height:22px}.bar{height:12px}.controls{left:12px;bottom:12px;gap:6px}.controls button{padding:7px 8px;font-size:12px}.ui-toggle,.cargo-toggle{position:fixed;z-index:40;right:12px;padding:7px 9px;border:1px solid #81d5e4;border-radius:7px;background:#082236e8;color:#eafaff;font-size:11px;font-weight:800;box-shadow:0 4px 12px #0008}.ui-toggle{top:12px}.cargo-toggle{top:50px;font-size:17px;padding:5px 8px}.quick-cargo{position:fixed;z-index:41;right:12px;top:88px;width:190px;max-height:55vh;overflow:auto;padding:8px;border:1px solid #74c7d8;border-radius:10px;background:#061d2df3;box-shadow:0 10px 26px #000b;display:none}.quick-cargo.open{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.quick-cargo button{position:relative;display:grid;place-items:center;min-height:58px;padding:5px;background:#0d3042;border:1px solid #407a8e;border-radius:7px;color:#eefaff;font-size:10px}.quick-cargo .quick-icon{display:grid;place-items:center;width:29px;height:22px;border-radius:3px;box-shadow:inset 0 0 0 1px #fff8;font-size:13px}.quick-cargo .quick-id{font-size:9px;font-weight:900;margin-top:2px}.quick-cargo button i{position:absolute;right:4px;top:3px;font-style:normal;color:#ffdb58;font-size:10px;font-weight:900}.ui-hidden .hud,.ui-hidden .right{display:none}.ui-hidden .help{display:none}`;
  document.head.append(compactUiStyle);
  const layoutFixStyle = document.createElement('style');
  layoutFixStyle.textContent = `.right{top:88px}.cargo-toggle{display:none}.ui-hidden .cargo-toggle{display:block}.ui-hidden .quick-cargo{right:12px}body:not(.ui-hidden) .quick-cargo{display:none!important}`;
  document.head.append(layoutFixStyle);
  const topUiToggle = document.createElement('button');
  topUiToggle.className = 'ui-toggle';
  topUiToggle.textContent = 'UI 숨김';
  topUiToggle.onclick = () => { const hidden = document.body.classList.toggle('ui-hidden'); topUiToggle.textContent = hidden ? 'UI 표시' : 'UI 숨김'; if (!hidden) quickCargo.classList.remove('open'); };
  document.body.append(topUiToggle);

  const cargoToggle = document.createElement('button');
  cargoToggle.className = 'cargo-toggle';
  cargoToggle.title = '화물 선택';
  cargoToggle.textContent = '📦';
  const quickCargo = document.createElement('div');
  quickCargo.className = 'quick-cargo';
  document.body.append(cargoToggle, quickCargo);
  function renderQuickCargo() {
    const groups = new Map();
    manifest.forEach((item, index) => {
      const key = `${item.t}|${item.id}`;
      if (!groups.has(key)) groups.set(key, { item, indexes: [] });
      groups.get(key).indexes.push(index);
    });
    quickCargo.innerHTML = '';
    groups.forEach((group) => {
      const available = group.indexes.filter((index) => !manifest[index].used);
      if (!available.length) return;
      const button = document.createElement('button');
      const type = types[group.item.t];
      button.title = `${group.item.id} · ${type.n} · 남은 ${available.length}개`;
      button.innerHTML = `<span class="quick-icon" style="background:#${type.c.toString(16).padStart(6, '0')}">${type.m}</span><span class="quick-id">${group.item.id}</span><i>${available.length}</i>`;
      button.onclick = () => {
        chosen = available[0];
        manifest[chosen].dir = dir;
        if (group.item.t === 'flat' && loadArea !== 'deck') { loadArea = 'deck'; areaButton.textContent = '적재 위치: 상갑판'; updateDeckTransparency(); }
        quickCargo.classList.remove('open');
        renderCards();
        toast(`${group.item.id} 적재 위치를 클릭하세요`);
      };
      quickCargo.append(button);
    });
  }
  cargoToggle.onclick = () => { renderQuickCargo(); quickCargo.classList.toggle('open'); };
  const renderCardsWithQuickPalette = renderCards;
  renderCards = function renderCardsAndQuickPalette() { renderCardsWithQuickPalette(); if (quickCargo.classList.contains('open')) renderQuickCargo(); };

  // The visible full deck is the natural default target. Players explicitly
  // switch to the recessed hold when they want below-deck stowage.
  let loadArea = 'deck';
  const fullDeckMesh = ship.children.find((object) => object.userData && object.userData.keepDeck);
  const updateDeckTransparency = () => {
    const seeThrough = loadArea === 'hold';
    if (fullDeckMesh) {
      fullDeckMesh.visible = !seeThrough;
    }
    ship.traverse((object) => {
      if (object.userData.upperDeckSurface) object.visible = !seeThrough;
      if (object.userData.deckCargo) object.visible = !seeThrough;
    });
  };
  updateDeckTransparency();
  const areaButton = document.createElement('button');
  areaButton.id = 'load-area';
  areaButton.textContent = '적재 위치: 상갑판';
  document.querySelector('.controls').append(areaButton);
  areaButton.onclick = () => {
    loadArea = loadArea === 'hold' ? 'deck' : 'hold';
    areaButton.textContent = loadArea === 'deck' ? '적재 위치: 상갑판' : '적재 위치: 선창';
    updateDeckTransparency();
    toast(loadArea === 'deck' ? '상갑판 전체에 적재합니다' : '배 내부 선창에 적재합니다');
  };
  const uiToggle = document.createElement('button');
  uiToggle.id = 'ui-toggle';
  uiToggle.style.display = 'none';
  uiToggle.textContent = 'UI 숨기기';
  document.querySelector('.controls').append(uiToggle);
  uiToggle.onclick = () => {
    const hidden = document.querySelector('.hud').classList.toggle('collapsed-ui');
    document.querySelector('.right').classList.toggle('collapsed-ui', hidden);
    uiToggle.textContent = hidden ? 'UI 표시' : 'UI 숨기기';
  };
  const uiStyle = document.createElement('style');
  uiStyle.textContent = '.hud.collapsed-ui,.right.collapsed-ui{display:none!important}';
  document.head.append(uiStyle);

  // Keep only the essential controls on screen. Rotation uses right-click and
  // help has its own question-mark button, so the loading-area switch can stay
  // visible without a separate drawer toggle.
  const dockStyle = document.createElement('style');
  dockStyle.textContent = `
    .controls.compact-actions{position:fixed;z-index:45;left:12px;top:auto;bottom:12px;display:flex;gap:6px}.controls.compact-actions button{padding:8px 10px;font-size:11px}.controls.compact-actions #turn,.controls.compact-actions #view,.controls.compact-actions #title-screen{display:none}
    .help-quick,.title-quick{display:grid;place-items:center;width:42px;height:42px;padding:0;border-radius:50%;border:2px solid #8ce8ff;background:linear-gradient(145deg,#18a9e5,#0872b8);color:#fff;font-size:27px;line-height:1;box-shadow:0 5px 15px #001c3888}
    .help-quick,.title-quick{position:fixed;z-index:45;font-size:25px}.help-quick{right:244px;top:20px}.title-quick{display:grid;left:202px;top:14px;width:42px;padding:0;font-size:25px;border-radius:50%}
    .ui-hidden .controls.compact-actions{display:none}.ui-hidden .title-quick{display:grid;left:8px;top:8px}.ui-hidden .help-quick{right:12px;top:12px}.ui-hidden .ui-toggle{top:62px}.ui-hidden .cargo-toggle{top:106px}
    @media(max-width:760px){.controls.compact-actions{left:8px;bottom:8px}.help-quick{right:12px;top:62px}.ui-hidden .help-quick{top:12px}}
  `;
  document.head.append(dockStyle);
  const controls = document.querySelector('.controls');
  const originalHelpButton = document.querySelector('#help');
  originalHelpButton.remove();
  uiToggle.remove();
  document.querySelector('#view').textContent = '⟳ 시점';
  document.querySelector('#title-screen').textContent = '⌂ 타이틀';
  controls.classList.add('compact-actions');
  const helpQuick = document.createElement('button');
  helpQuick.className = 'help-quick';
  helpQuick.setAttribute('aria-label', '적재 도움말');
  helpQuick.textContent = '?';
  helpQuick.onclick = () => helpBackdrop.classList.add('open');
  document.body.append(helpQuick);
  const titleQuick = document.createElement('button');
  titleQuick.className = 'title-quick';
  titleQuick.setAttribute('aria-label', '타이틀 화면으로 돌아가기');
  titleQuick.title = '타이틀 화면으로 돌아가기';
  titleQuick.textContent = '⌂';
  titleQuick.onclick = () => location.href = 'index.html';
  document.body.append(titleQuick);

  // Pick against the actual active loading surface. The former fixed sea-level
  // plane made a click on a visible container land in a different cell when
  // the camera was tilted, which prevented reliable stacking.
  screen = function screenOnActiveLoadingArea(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const surfaceY = loadArea === 'deck' ? 0.60 : -2.82;
    const loadingPlane = new T.Plane(new T.Vector3(0, 1, 0), -surfaceY);
    const point = new T.Vector3();
    ray.ray.intersectPlane(loadingPlane, point);
    const x = Math.floor(point.x / S + W / 2);
    const z = Math.floor(point.z / S + D / 2);
    return x >= 0 && x < W && z >= 0 && z < D ? [x, z] : null;
  };

  const originalHeight = height;
  height = function heightForSelectedArea(item, x, z) {
    if (loadArea !== 'deck') return originalHeight(item, x, z);
    const footprint = cells(item, x, z);
    if (footprint.some(([a, b]) => a < 0 || a >= W || b < 0 || b >= D)) return -1;
    for (let y = 2; y < H; y += 1) {
      if (footprint.some(([a, b]) => board[a][b][y])) continue;
      if (y > 2 && footprint.some(([a, b]) => !board[a][b][y - 1])) continue;
      return y;
    }
    return -1;
  };

  // Keep the camera above the water surface at every zoom distance. The lower
  // limit adapts to the orbit radius, so zooming out cannot pull the camera
  // underwater after the player has selected a low side view.
  const minimumViewPhi = () => Math.asin(Math.max(-0.95, Math.min(0, -3.15 / dist)));
  const cameraMoveBeforeWaterlineLimit = cameraMove;
  cameraMove = function cameraMoveAboveWater() {
    phi = Math.max(minimumViewPhi(), Math.min(1.35, phi));
    cameraMoveBeforeWaterlineLimit();
  };
  cv.addEventListener('pointermove', (event) => {
    if (!drag) return;
    phi = Math.max(minimumViewPhi(), Math.min(1.35, drag[3] + (event.clientY - drag[1]) * 0.006));
    cameraMove();
  });

  const baseUpdate = update;
  // Cargo may not span a watertight bulkhead.  The gaps between these three
  // ranges are the actual transverse partitions / access passages.
  const deckRows = new Set([0, 4, 11]);
  const isDeckFootprint = (item, x, z) => cells(item, x, z).every(([, row]) => deckRows.has(row));
  const holdForRow = (z) => {
    if (deckRows.has(z)) return 10 + z;
    if (z >= 1 && z <= 3) return 0;
    if (z >= 5 && z <= 7) return 1;
    if (z >= 8 && z <= 10) return 2;
    return -1;
  };
  const originalAllowed = allowed;
  allowed = function allowedInsideOneHold(item, x, z, y) {
    if (loadArea === 'deck') return item.t === 'general' || item.t === 'flat' || item.t === 'reefer' || item.t === 'flammable';
    if (item.t === 'flat') return false;
    const occupiedHolds = cells(item, x, z).map(([, row]) => holdForRow(row));
    if (occupiedHolds.some((hold) => hold < 0) || new Set(occupiedHolds).size !== 1) return false;
    if (isDeckFootprint(item, x, z)) {
      return item.t === 'general' || item.t === 'flat' || item.t === 'reefer' || (item.t === 'flammable' && y === 0);
    }
    return originalAllowed(item, x, z, y);
  };
  // Special cargo may be loaded onto a supported surface, but never used as a
  // supporting surface itself. Refrigerated boxes additionally need a clear
  // side for airflow and access, so they cannot be boxed in on every side.
  const allowedBeforeSafetyRules = allowed;
  const noStackCargo = new Set(['flat', 'liquid', 'flammable']);
  const hasReeferClearSide = (item, x, z, y, addedFootprint = null) => {
    const footprint = new Set(cells(item, x, z).map(([cellX, cellZ]) => `${cellX}:${cellZ}`));
    for (const [cellX, cellZ] of cells(item, x, z)) {
      for (const [nearX, nearZ] of [[cellX - 1, cellZ], [cellX + 1, cellZ], [cellX, cellZ - 1], [cellX, cellZ + 1]]) {
        if (nearX < 0 || nearX >= W || nearZ < 0 || nearZ >= D) return true;
        if (footprint.has(`${nearX}:${nearZ}`)) continue;
        if (!addedFootprint?.has(`${nearX}:${nearZ}`) && !board[nearX][nearZ][y]) return true;
      }
    }
    return false;
  };
  const wouldSealExistingReefer = (item, x, z, y) => {
    const addedFootprint = new Set(cells(item, x, z).map(([cellX, cellZ]) => `${cellX}:${cellZ}`));
    const checked = new Set();
    for (let cellX = 0; cellX < W; cellX += 1) for (let cellZ = 0; cellZ < D; cellZ += 1) {
      const existing = board[cellX][cellZ][y];
      if (!existing || existing.item.t !== 'reefer') continue;
      const key = `${existing.x}:${existing.z}:${existing.y}`;
      if (checked.has(key)) continue;
      checked.add(key);
      if (!hasReeferClearSide(existing.item, existing.x, existing.z, existing.y, addedFootprint)) return true;
    }
    return false;
  };
  allowed = function allowedWithSpecialCargoSafety(item, x, z, y) {
    if (!allowedBeforeSafetyRules(item, x, z, y)) return false;
    if (y > 0 && cells(item, x, z).some(([cellX, cellZ]) => {
      const support = board[cellX][cellZ][y - 1];
      return support && noStackCargo.has(support.item.t);
    })) return false;
    if (wouldSealExistingReefer(item, x, z, y)) return false;
    return item.t !== 'reefer' || hasReeferClearSide(item, x, z, y);
  };
  update = function updateWithSofterBalance() {
    baseUpdate();
    const offset = cg();
    document.querySelector('#meter').style.transform = `translateX(${offset * 30}px)`;
    document.querySelector('#balance').textContent = Math.abs(offset) < 0.55 ? '안정' : Math.abs(offset) < 1.15 ? '주의' : '위험';
  };
  update();

  const levelStep = 1.62;
  const containerHeight = (item) => item.id.includes('HC') ? 1.5 : 1.1;
  const stackBase = (item, x, z, y) => {
    if ((item._onDeck || loadArea === 'deck') && y === 2) return 0.60;
    if (y === 0) return isDeckFootprint(item, x, z) ? 0.60 : -2.82;
    const supports = cells(item, x, z).map(([a, b]) => board[a][b][y - 1]);
    return Math.max(...supports.map((support) => support.item._stackBase + containerHeight(support.item)));
  };
  cargoMesh = function cargoMeshWithRealHeight(item, x, z, y) {
    const length = item.s;
    const width = item.dir === 'x' ? length * S - 0.13 : S;
    const depth = item.dir === 'z' ? length * S - 0.13 : S;
    const height = containerHeight(item);
    const geometry = new T.BoxGeometry(width, height, depth);
    const group = new T.Group();
    const mesh = new T.Mesh(geometry, new T.MeshStandardMaterial({ color: types[item.t].c, roughness: 0.28, metalness: 0.48 }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    group.add(new T.LineSegments(new T.EdgesGeometry(geometry), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })));
    const grooves = new T.LineBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.44 });
    for (let column = -4; column <= 4; column += 1) {
      const line = new T.BufferGeometry().setFromPoints([new T.Vector3(column * width / 10, -height * 0.42, depth / 2 + 0.004), new T.Vector3(column * width / 10, height * 0.42, depth / 2 + 0.004)]);
      group.add(new T.Line(line, grooves));
    }
    const base = item._stackBase ?? (-2.82 + y * levelStep);
    group.position.set((x - (W - 1) / 2 + (item.dir === 'x' ? (length - 1) / 2 : 0)) * S, base + height / 2, (z - (D - 1) / 2 + (item.dir === 'z' ? (length - 1) / 2 : 0)) * S);
    if (item._onDeck) group.traverse((part) => { part.userData.deckCargo = true; });
    ship.add(group);
    updateDeckTransparency();
  };

  const originalShowGhost = showGhost;
  showGhost = function showGhostWithHeight(x, z) {
    originalShowGhost(x, z);
    if (chosen === null || !ghost.visible) return;
    const item = manifest[chosen];
    const level = height(item, x, z);
    const heightValue = containerHeight(item);
    const length = item.s;
    ghost.geometry.dispose();
    ghost.geometry = new T.BoxGeometry(item.dir === 'x' ? length * S - 0.13 : S, heightValue, item.dir === 'z' ? length * S - 0.13 : S);
    ghost.position.y = stackBase(item, x, z, level) + heightValue / 2;
  };

  // The grid is logical, but the containers use their true visual heights.  Store
  // each container's physical base so the next container sits directly on it.
  const originalPlace = place;
  place = function placeWithPhysicalStacking(x, z) {
    if (chosen === null || ended) return;
    const item = manifest[chosen];
    const y = height(item, x, z);
    if (y < 0 || !allowed(item, x, z, y)) return originalPlace(x, z);
    item._onDeck = loadArea === 'deck';
    item._stackBase = stackBase(item, x, z, y);
    const previousCargoMesh = cargoMesh;
    cargoMesh = function cargoWithSavedBase(nextItem, nextX, nextZ, nextY) {
      previousCargoMesh(nextItem, nextX, nextZ, nextY);
      cargoMesh = previousCargoMesh;
    };
    return originalPlace(x, z);
  };

  ship.traverse((object) => {
    if (object.isLine) object.visible = false;
    // Remove the old solid deck and its hatch covers: the playable cells now live
    // inside open cargo holds, not on a flat platform.
    if (object.isMesh && object.geometry?.parameters) {
      const p = object.geometry.parameters;
      if (!object.userData.keepDeck && p.height <= 0.18 && p.width > W * S - 1 && p.depth > 2.4) object.visible = false;
    }
  });

  const steel = new T.MeshStandardMaterial({ color: 0x263d46, roughness: 0.5, metalness: 0.55 });
  const innerWall = new T.MeshStandardMaterial({ color: 0x78929a, roughness: 0.62, metalness: 0.2 });
  const addPart = (geometry, material, position) => {
    const part = new T.Mesh(geometry, material);
    part.position.set(...position);
    part.castShadow = true;
    part.receiveShadow = true;
    ship.add(part);
    return part;
  };
  const holdCenters = [-6.2, 0, 6.2];
  holdCenters.forEach((z) => {
    addPart(new T.BoxGeometry(W * S - 1.1, 0.1, 5.25), steel, [0, -2.92, z]);
    addPart(new T.BoxGeometry(0.18, 3.45, 5.35), innerWall, [-W * S / 2 + 0.4, -1.2, z]);
    addPart(new T.BoxGeometry(0.18, 3.45, 5.35), innerWall, [W * S / 2 - 0.4, -1.2, z]);
    addPart(new T.BoxGeometry(W * S - 0.9, 3.45, 0.18), innerWall, [0, -1.2, z - 2.6]);
    addPart(new T.BoxGeometry(W * S - 0.9, 3.45, 0.18), innerWall, [0, -1.2, z + 2.6]);
  });
  // One continuous hold floor prevents visual gaps between cargo bays.
  addPart(new T.BoxGeometry(W * S - 1.1, 0.1, D * S - 1.0), steel, [0, -2.92, 0]);
  // A real deck surrounds the hatch openings.  Only the three hatch mouths
  // remain open so the below-deck cargo holds can still be seen and loaded.
  const deckSurface = new T.MeshStandardMaterial({ color: 0x3d555d, roughness: 0.5, metalness: 0.52 });
  const fullDeckWidth = W * S + 0.36;
  const deckSideWidth = 0.72;
  addPart(new T.BoxGeometry(deckSideWidth, 0.16, D * S + 0.4), deckSurface, [-fullDeckWidth / 2 + deckSideWidth / 2, 0.42, 0]);
  addPart(new T.BoxGeometry(deckSideWidth, 0.16, D * S + 0.4), deckSurface, [fullDeckWidth / 2 - deckSideWidth / 2, 0.42, 0]);
  [-10.05, -3.12, 3.12, 10.05].forEach((z) => addPart(new T.BoxGeometry(fullDeckWidth - deckSideWidth * 2, 0.16, 1.15), deckSurface, [0, 0.42, z]));
  const deckEdgeMat = new T.LineBasicMaterial({ color: 0xb6dde0, transparent: true, opacity: 0.7 });
  holdCenters.forEach((z) => {
    const hatchEdge = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(W * S - 1.02, 0.02, 5.18)), deckEdgeMat);
    hatchEdge.position.set(0, 0.51, z); ship.add(hatchEdge);
  });
  // Three solid upper-deck strips are real playable deck positions, separate
  // from the recessed cargo holds below.
  [0, 4, 11].forEach((row) => {
    const deckZ = (row - (D - 1) / 2) * S;
    const deckStrip = addPart(new T.BoxGeometry(W * S - 0.9, 0.14, S - 0.1), steel, [0, 0.41, deckZ]);
    deckStrip.userData.upperDeckSurface = true;
    const deckLabel = document.createElement('canvas'); deckLabel.width = 256; deckLabel.height = 64;
    const context = deckLabel.getContext('2d'); context.fillStyle = '#baf8f3'; context.font = 'bold 22px sans-serif'; context.textAlign = 'center'; context.fillText('UPPER DECK', 128, 39);
    const sign = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(deckLabel), transparent: true }));
    sign.position.set(0, 0.53, deckZ); sign.scale.set(1.8, 0.45, 1); sign.userData.upperDeckSurface = true; ship.add(sign);
  });
  addPart(new T.BoxGeometry(0.62, 0.18, D * S), innerWall, [-W * S / 2 + 0.22, 0.52, 0]);
  addPart(new T.BoxGeometry(0.62, 0.18, D * S), innerWall, [W * S / 2 - 0.22, 0.52, 0]);

  // Keep the hold visually open; partitions are enforced by placement rules,
  // not by walls that obstruct the player's camera.
  ship.traverse((object) => { if (object.isMesh && object.material === innerWall) object.visible = false; });

  // Floating bay frames make each stacking level readable without closing the holds.
  for (let level = 1; level < H; level += 1) {
    const guide = new T.LineSegments(
      new T.EdgesGeometry(new T.BoxGeometry(W * S - 0.85, 0.01, D * S - 0.85)),
      new T.LineBasicMaterial({ color: 0x7ee7df, transparent: true, opacity: 0.28 })
    );
    guide.position.y = -2.82 + level * levelStep;
    ship.add(guide);
  }

  // Give the world its own motion too.  The ship now rides a small swell while
  // the water and harbour panorama drift in the opposite direction, so the
  // vessel is not the only object that appears to move on screen.
  const waveCanvas = document.createElement('canvas');
  waveCanvas.width = waveCanvas.height = 512;
  const waveContext = waveCanvas.getContext('2d');
  const waveGradient = waveContext.createLinearGradient(0, 0, 512, 512);
  waveGradient.addColorStop(0, '#053d5a'); waveGradient.addColorStop(1, '#0a7190');
  waveContext.fillStyle = waveGradient; waveContext.fillRect(0, 0, 512, 512);
  waveContext.strokeStyle = 'rgba(207,246,255,.22)'; waveContext.lineWidth = 2;
  for (let row = 18; row < 512; row += 38) {
    waveContext.beginPath();
    for (let column = -20; column < 540; column += 20) {
      const y = row + Math.sin(column * .043 + row) * 5;
      column < 0 ? waveContext.moveTo(column, y) : waveContext.lineTo(column, y);
    }
    waveContext.stroke();
  }
  const waveTexture = new T.CanvasTexture(waveCanvas);
  waveTexture.wrapS = waveTexture.wrapT = T.RepeatWrapping;
  waveTexture.repeat.set(10, 10);
  const movingSea = new T.Mesh(
    new T.PlaneGeometry(180, 180),
    new T.MeshStandardMaterial({ map: waveTexture, color: 0x176b82, roughness: .56, metalness: .24 })
  );
  movingSea.rotation.x = -Math.PI / 2;
  movingSea.position.y = -3.74;
  movingSea.receiveShadow = true;
  scene.add(movingSea);

  if (typeof harborTexture !== 'undefined') {
    harborTexture.wrapS = harborTexture.wrapT = T.RepeatWrapping;
    harborTexture.repeat.set(1.04, 1.04);
  }

  animate = function animateWithWorldMotion() {
    requestAnimationFrame(animateWithWorldMotion);
    const time = clock.getElapsedTime();
    if (!ended) {
      const heave = Math.sin(time * .72) * .045 + Math.sin(time * 1.27) * .015;
      const roll = Math.sin(time * .58) * .009;
      const pitch = Math.sin(time * .43 + .8) * .006;
      ship.position.y = heave;
      ship.rotation.z = roll;
      ship.rotation.x = pitch;
      movingSea.position.x = -Math.sin(time * .19) * .32;
      movingSea.position.z = -Math.cos(time * .16) * .42;
      waveTexture.offset.x = time * .006;
      waveTexture.offset.y = time * .004;
      if (typeof harborTexture !== 'undefined') {
        harborTexture.offset.x = .02 + Math.sin(time * .22) * .012 - roll * .35;
        harborTexture.offset.y = .01 + Math.sin(time * .43) * .006 - heave * .035;
      }
    }
    renderer.render(scene, camera);
  };
});
