if (!new URLSearchParams(location.search).has('play')) location.replace('index.html');
window.addEventListener('load', () => {
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
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
  const hullSteel = new T.MeshStandardMaterial({ color: 0x8c2f27, roughness: 0.48, metalness: 0.38, side: T.DoubleSide });
  const navySteel = new T.MeshStandardMaterial({ color: 0x102c3a, roughness: 0.38, metalness: 0.5, side: T.DoubleSide });
  const darkSteel = new T.MeshStandardMaterial({ color: 0x071a22, roughness: 0.35, metalness: 0.58, side: T.DoubleSide });
  const deckSteel = new T.MeshStandardMaterial({ color: 0x415961, roughness: 0.46, metalness: 0.52 });
  const whiteSteel = new T.MeshStandardMaterial({ color: 0xd6e2e3, roughness: 0.42, metalness: 0.45 });
  const deckBaseY = 0.60, holdDepth = Math.max(3.42, HOLD_LAYERS * 0.72), holdFloorY = deckBaseY - holdDepth, levelStep = holdDepth / HOLD_LAYERS, hullHeight = holdDepth + 0.72, hullCenterY = deckBaseY - hullHeight / 2;
  const halfBeam = W * S / 2 + .52, halfLength = D * S / 2 + .28;
  const waterlineY = deckBaseY - Math.min(1.25, hullHeight * .34), keelY = holdFloorY - .42;
  const hullStations = [[-halfLength,.9],[-halfLength*.82,1],[-halfLength*.25,1],[halfLength*.48,.99],[halfLength*.7,.88],[halfLength*.86,.58],[halfLength*.96,.25],[halfLength*1.02,.025]];
  const makeHullBand = (side, topY, bottomY, topScale, bottomScale, material) => {
    const positions=[],indices=[];
    hullStations.forEach(([z,factor])=>positions.push(side*halfBeam*factor*topScale,topY,z,side*halfBeam*factor*bottomScale,bottomY,z));
    for(let i=0;i<hullStations.length-1;i++){
      const a=i*2,b=a+1,c=a+2,d=a+3;
      // Port and starboard plates need opposite winding. Using the same index
      // order made one entire side a back face that vanished at certain angles.
      if(side<0) indices.push(a,b,d,a,d,c);
      else indices.push(a,d,b,a,c,d);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    return cleanAdd(geometry,material,[0,0,0]);
  };
  [-1,1].forEach(side=>{
    makeHullBand(side,deckBaseY-.03,waterlineY+.05,1,.98,navySteel);
    makeHullBand(side,waterlineY-.05,keelY,.98,.22,hullSteel);
    makeHullBand(side,waterlineY+.05,waterlineY-.05,1,.99,whiteSteel);
  });
  const keelPositions=[],keelIndices=[];
  hullStations.forEach(([z,factor])=>keelPositions.push(-halfBeam*factor*.22,keelY,z,halfBeam*factor*.22,keelY,z));
  for(let i=0;i<hullStations.length-1;i++){const a=i*2,b=a+1,c=a+2,d=a+3;keelIndices.push(a,c,d,a,d,b)}
  const keelGeometry=new T.BufferGeometry();keelGeometry.setAttribute('position',new T.Float32BufferAttribute(keelPositions,3));keelGeometry.setIndex(keelIndices);keelGeometry.computeVertexNormals();cleanAdd(keelGeometry,hullSteel,[0,0,0]);
  cleanAdd(new T.BoxGeometry(halfBeam*1.8,hullHeight*.98,.28),navySteel,[0,hullCenterY,-halfLength]);
  const deckShape=new T.Shape();deckShape.moveTo(-halfBeam,-halfLength);deckShape.lineTo(halfBeam,-halfLength);deckShape.lineTo(halfBeam,halfLength*.56);deckShape.lineTo(halfBeam*.84,halfLength*.78);deckShape.lineTo(halfBeam*.48,halfLength*.94);deckShape.lineTo(0,halfLength*1.025);deckShape.lineTo(-halfBeam*.48,halfLength*.94);deckShape.lineTo(-halfBeam*.84,halfLength*.78);deckShape.lineTo(-halfBeam,halfLength*.56);deckShape.closePath();
  const deckGeometry=new T.ShapeGeometry(deckShape);deckGeometry.rotateX(Math.PI/2);const deckMesh=cleanAdd(deckGeometry,new T.MeshStandardMaterial({color:0x415961,roughness:.46,metalness:.52,side:T.DoubleSide}),[0,.49,0]);deckMesh.userData.keepDeck=true;
  const bulbousBow=cleanAdd(new T.SphereGeometry(1,40,24),hullSteel,[0,keelY+.62,halfLength*1.015]);bulbousBow.scale.set(Math.max(.58,W*S*.075),.4,1.08);
  [-1,1].forEach(side=>cleanAdd(new T.BoxGeometry(.16,.68,D*S*.78),whiteSteel,[side*(halfBeam-.08),.82,-D*S*.08]));
  const bridgeZ=-halfLength+1.3,funnelZ=bridgeZ+2.05;
  cleanAdd(new T.BoxGeometry(5.4,.65,1.9), whiteSteel, [0, .92, bridgeZ]);
  cleanAdd(new T.BoxGeometry(4.7,1.55,1.55), whiteSteel, [0, 1.96, bridgeZ]);
  const bridgeWindows = cleanAdd(new T.BoxGeometry(4.18,.46,.08), new T.MeshStandardMaterial({color:0x123e53,roughness:.18,metalness:.7}), [0, 2.25, bridgeZ+.79]);
  cleanAdd(new T.BoxGeometry(5.35,.18,2.08), whiteSteel, [0, 2.85, bridgeZ]);
  // Bridge wings, side windows, funnel and navigation equipment make the
  // stern/superstructure readable from front, side and aerial viewpoints.
  [-1, 1].forEach((side) => {
    cleanAdd(new T.BoxGeometry(1.0, .18, 1.62), whiteSteel, [side * 2.75, 2.42, bridgeZ]);
    cleanAdd(new T.BoxGeometry(.05, .42, 1.05), darkSteel, [side * 2.38, 2.18, bridgeZ]);
    const lifeboat = cleanAdd(new T.SphereGeometry(1, 24, 14), new T.MeshStandardMaterial({ color: 0xf17a24, roughness: .42, metalness: .2 }), [side * (halfBeam + .18), 1.65, funnelZ]);
    lifeboat.scale.set(.28, .28, .88);
  });
  cleanAdd(new T.BoxGeometry(1.45, 1.45, 1.35), new T.MeshStandardMaterial({ color: 0xe3aa28, roughness: .42, metalness: .35 }), [0, 2.05, funnelZ]);
  cleanAdd(new T.BoxGeometry(1.52, .38, 1.42), darkSteel, [0, 2.95, funnelZ]);
  cleanAdd(new T.CylinderGeometry(.055, .085, 2.2, 12), whiteSteel, [0, 4.0, bridgeZ]);
  cleanAdd(new T.BoxGeometry(2.25, .07, .09), whiteSteel, [0, 4.58, bridgeZ]);
  cleanAdd(new T.SphereGeometry(.16, 18, 12), new T.MeshStandardMaterial({ color: 0xf4f7f2, roughness: .25, metalness: .4 }), [-.72, 4.82, bridgeZ]);
  cleanAdd(new T.SphereGeometry(.16, 18, 12), new T.MeshStandardMaterial({ color: 0xf4f7f2, roughness: .25, metalness: .4 }), [.72, 4.82, bridgeZ]);
  // Slim red cell guides along both hatch sides echo a real container ship
  // without placing obstructive bulkheads across the playable cargo bays.
  const guideSteel = new T.MeshStandardMaterial({ color: 0xa52b25, roughness: .43, metalness: .5 });
  for (let z = -halfLength*.55; z <= halfLength*.62; z += 3.5) [-1, 1].forEach((side) => {
    cleanAdd(new T.BoxGeometry(.09, 2.35, .09), guideSteel, [side * (W * S / 2 - .52), 1.72, z]);
    cleanAdd(new T.BoxGeometry(.09, .09, 1.35), guideSteel, [side * (W * S / 2 - .52), 2.86, z + .62]);
  });
  // Anchors and hawse pipes identify the pointed bow in low side views.
  [-1, 1].forEach((side) => {
    const hawse = cleanAdd(new T.TorusGeometry(.21, .065, 10, 24), darkSteel, [side * halfBeam*.68, -.05, halfLength*.76]);
    hawse.rotation.y = Math.PI / 2;
    const anchorStem = cleanAdd(new T.BoxGeometry(.08, .58, .08), darkSteel, [side * halfBeam*.69, -.38, halfLength*.76]);
    anchorStem.rotation.z = side * .12;
  });
  // High-resolution hull name decals on port and starboard sides.
  const nameCanvas = document.createElement('canvas'); nameCanvas.width = 1024; nameCanvas.height = 192;
  const nameContext = nameCanvas.getContext('2d'); nameContext.clearRect(0, 0, 1024, 192); nameContext.fillStyle = '#f1f5f4'; nameContext.font = '900 92px Arial'; nameContext.textAlign = 'center'; nameContext.fillText('CARGO MASTER', 512, 122);
  const nameTexture = new T.CanvasTexture(nameCanvas); nameTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  [-1, 1].forEach((side) => {
    const namePlate = new T.Mesh(new T.PlaneGeometry(Math.min(8.8, D * S * .42), 1.4), new T.MeshBasicMaterial({ map: nameTexture, transparent: true, side: T.FrontSide, depthWrite: false }));
    namePlate.position.set(side * (W * S / 2 + .57), deckBaseY - hullHeight * .3, .2); namePlate.rotation.y = side * Math.PI / 2; ship.add(namePlate);
  });
  for (let z = -halfLength*.9; z <= halfLength*.7; z += 1.5) [-1,1].forEach((side) => cleanAdd(new T.BoxGeometry(.05,.5,.05), whiteSteel, [side*(halfBeam+.1),1.32,z]));
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
  // Legacy bow geometry remains disabled; the continuous station-based hull
  // above supplies the actual pointed bow and V-shaped underwater body.
  const bowVertices = new Float32Array([
    -4.62, 0.34, -2.0, 4.62, 0.34, -2.0, -4.35, -2.48, -2.0, 4.35, -2.48, -2.0,
    -0.74, 0.30, 2.16, 0.74, 0.30, 2.16, -0.24, -1.42, 2.16, 0.24, -1.42, 2.16
  ]);
  const bowFaces = [0,1,5,0,5,4, 0,4,6,0,6,2, 1,3,7,1,7,5, 2,6,7,2,7,3, 4,5,7,4,7,6, 0,2,3,0,3,1];
  const bowGeometry = new T.BufferGeometry();
  bowGeometry.setAttribute('position', new T.BufferAttribute(bowVertices, 3)); bowGeometry.setIndex(bowFaces); bowGeometry.computeVertexNormals();
  const pointedBow = new T.Mesh(bowGeometry, new T.MeshStandardMaterial({ color: 0x7d211c, roughness: 0.42, metalness: 0.32 }));
  pointedBow.position.set(0, 0, 9.7); pointedBow.castShadow = pointedBow.receiveShadow = true; pointedBow.visible = !ship.userData.cleanHull; ship.add(pointedBow);

  function addZone(x, z, w, d, color, label, surfaceY) {
    const tile = new T.Mesh(new T.BoxGeometry(w * S - 0.12, 0.035, d * S - 0.12), new T.MeshStandardMaterial({ color, transparent: true, opacity: 0.62, emissive: color, emissiveIntensity: 0.25 }));
    tile.position.set((x - (W - 1) / 2 + (w - 1) / 2) * S, surfaceY, (z - (D - 1) / 2 + (d - 1) / 2) * S);
    ship.add(tile);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.font = 'bold 24px sans-serif'; context.textAlign = 'center'; context.fillText(label, 128, 39);
    const marker = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(canvas), transparent: true }));
    marker.position.copy(tile.position); marker.position.y += .22; marker.scale.set(1.6, 0.4, 1); ship.add(marker);
  }
  const customZoneStyle = {
    flat: [0xe69b27, 'FLAT RACK'],
    reefer: [0x1689e1, 'REEFER ⚡'],
    tank: [0x8452a5, 'TANK SAFE']
  };
  for (const [zoneKey, zoneType] of MANUAL_ZONES) {
    const style = customZoneStyle[zoneType];
    if (!style) continue;
    const [area, x, z, y] = zoneKey.split(':');
    const level = +y;
    const surfaceY = area === 'deck'
      ? deckBaseY + Math.max(0, level - HOLD_LAYERS) * 1.56 + .01
      : holdFloorY + level * levelStep + .1;
    addZone(+x, +z, 1, 1, style[0], style[1], surfaceY);
  }
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
        const hasHoldFlatRackZone = [...MANUAL_ZONES].some(([zoneKey, zoneType]) => zoneType === 'flat' && zoneKey.startsWith('hold:'));
        if (chosen !== null && item.t === 'flat' && loadArea !== 'deck' && !hasHoldFlatRackZone) {
          loadArea = 'deck';
          areaButton.textContent = '적재 위치: 상갑판';
          updateDeckTransparency();
          toast('플랫랙은 상갑판에만 적재합니다');
        } else if (chosen !== null && item.t === 'flat' && loadArea === 'hold' && hasHoldFlatRackZone) {
          toast('선창의 FLAT RACK 전용 구역에 배치하세요');
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
    .stow-help h2{margin:0 34px 12px 0;color:#fff;font-size:23px}.stow-help h3{margin:18px 0 7px;color:#83e7d2;font-size:15px}.stow-help p,.stow-help li{line-height:1.55;font-size:14px}.stow-help p{margin:4px 0}.stow-help ul{margin:6px 0;padding-left:21px}.stow-help li{margin:5px 0}.stow-help strong{color:#ffd55b}.stow-help kbd{display:inline-block;min-width:28px;padding:2px 6px;border:1px solid #78b6c8;border-bottom-width:3px;border-radius:5px;background:#061824;color:#fff;text-align:center;font:700 12px system-ui}.stow-help .zone-key{display:inline-block;padding:1px 6px;border-radius:4px;color:#fff;font-size:12px;font-weight:900}.stow-help-close{position:absolute;right:14px;top:12px;width:34px;height:34px;padding:0;border-radius:50%;font-size:24px;line-height:30px;background:#1d607d}
  `;
  document.head.append(helpStyle);
  const helpBackdrop = document.createElement('div');
  helpBackdrop.className = 'stow-help-backdrop';
  helpBackdrop.innerHTML = `<section class="stow-help" role="dialog" aria-modal="true" aria-labelledby="stow-help-title"><button class="stow-help-close" aria-label="도움말 닫기">×</button><h2 id="stow-help-title">조작 및 적재 규칙</h2>
    <h3>기본 조작</h3><ul>
      <li>오른쪽 화물 목록에서 화물을 선택하고 선박의 빈 칸을 클릭하면 적재합니다. 선택한 화물을 다시 누르면 선택이 해제됩니다.</li>
      <li><strong>마우스 드래그</strong>: 선박 회전 · <strong>휠</strong>: 확대/축소</li>
      <li><kbd>우클릭</kbd> 또는 <strong>40피트 회전</strong>: 40ft/40HC 화물의 가로·세로 방향 전환</li>
      <li><strong>적재 위치</strong> 버튼: 선창과 상갑판 전환. 현재 선택한 공간에만 화물이 들어갑니다.</li>
      <li>설치한 화물 위에 커서를 올리고 <kbd>Backspace</kbd>: 화물을 목록으로 되돌립니다. 위 화물부터 제거해야 합니다.</li>
      <li><strong>UI 숨김</strong>: 화면 패널을 감춥니다. 숨김 상태에서도 간편 화물 아이콘, 도움말, 초기화, 이전 화면 버튼을 사용할 수 있습니다.</li>
    </ul>
    <h3>칸과 쌓기 규칙</h3><ul>
      <li>20ft는 1칸, 40ft와 40HC는 방향에 따라 연속된 2칸을 차지합니다.</li>
      <li>2층 이상은 화물이 차지하는 <strong>모든 칸 아래</strong>가 다른 화물로 완전히 지지되어야 합니다. 공중이나 절반만 받친 상태로는 적재할 수 없습니다.</li>
      <li>선창과 상갑판은 별도의 적재 공간입니다. 기본 상갑판은 최대 4층이며, 수동 시뮬레이션에서는 설정한 층수를 사용합니다.</li>
      <li>플랫랙·액체·위험물 위에는 다른 화물을 쌓을 수 없습니다.</li>
      <li>냉동 화물은 사방이 다른 화물로 막히면 안 됩니다. 적어도 한 면은 비어 있어야 합니다.</li>
      <li>빨간 X의 <strong>적재 금지 칸</strong>에는 어떤 화물도 놓을 수 없습니다.</li>
    </ul>
    <h3>특수 구역 표시</h3><ul>
      <li><span class="zone-key" style="background:#8b6812">FLAT RACK</span> 플랫랙 전용 구역</li>
      <li><span class="zone-key" style="background:#087aa8">REEFER ⚡</span> 냉동 화물 전원 구역</li>
      <li><span class="zone-key" style="background:#70408b">TANK SAFE</span> 액체·위험물용 안전구역</li>
      <li>특수 구역은 AI 설정 화면에서 사용자가 지정한 경우에만 나타납니다.</li>
    </ul>
    <h3>화물별 적재 가능 위치</h3><ul>
      <li><strong>일반 컨테이너(빨간색)</strong>: 선창과 상갑판의 일반 칸. 지지 조건을 만족하면 위층에도 적재 가능</li>
      <li><strong>플랫랙(주황색)</strong>: 상갑판 또는 FLAT RACK 전용 구역. 플랫랙 위에는 추가 적재 불가</li>
      <li><strong>냉동 컨테이너(파란색·❄)</strong>: 상갑판 또는 REEFER ⚡ 전원 구역. 최소 한 면 개방 필수</li>
      <li><strong>액체 탱크(보라색·◉)</strong>: 선창 하부 1~2층 또는 TANK SAFE 구역. 위에 추가 적재 불가</li>
      <li><strong>위험물(주황색·🔥)</strong>: 상갑판 또는 TANK SAFE 구역. 위에 추가 적재 불가</li>
      <li><strong>중량 화물(검은색·◆)</strong>: 선창 바닥층의 좌우 중앙부. 높은 층이나 선박 가장자리에는 적재 불가</li>
    </ul>
    <h3>무게중심·점수·종료 조건</h3><ul>
      <li>무거운 화물은 낮고 중앙에 두고, 좌현과 우현에 무게를 나눠 게이지가 녹색 구간에 머물게 하세요.</li>
      <li>점수는 규칙 적합성, 공간 효율, 하중 분산을 반영합니다.</li>
      <li>금지 위치 또는 지지되지 않은 위치에 적재하거나 무게중심이 안전 한계를 넘으면 게임 오버와 침몰 효과가 발생합니다.</li>
      <li>목록의 모든 화물을 규칙에 맞게 적재하면 항차가 완료됩니다.</li>
    </ul><p><strong>도움말은 자동으로 닫히지 않습니다. 오른쪽 위 × 버튼으로 닫으세요.</strong></p></section>`;
  document.body.append(helpBackdrop);
  const closeHelp = () => helpBackdrop.classList.remove('open');
  helpBackdrop.querySelector('.stow-help-close').onclick = closeHelp;
  document.querySelector('#help').onclick = () => helpBackdrop.classList.add('open');
  const restartButton = document.querySelector('#again');
  restartButton.textContent = '새 항차 시작';
  const titleButton = document.createElement('button');
  titleButton.id = 'modal-title-button';
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
        const hasHoldFlatRackZone = [...MANUAL_ZONES].some(([zoneKey, zoneType]) => zoneType === 'flat' && zoneKey.startsWith('hold:'));
        if (group.item.t === 'flat' && loadArea !== 'deck' && !hasHoldFlatRackZone) { loadArea = 'deck'; areaButton.textContent = '적재 위치: 상갑판'; updateDeckTransparency(); }
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
    .help-quick,.title-quick,.reset-quick{display:grid;place-items:center;width:42px;height:42px;padding:0;border-radius:50%;border:2px solid #8ce8ff;background:linear-gradient(145deg,#18a9e5,#0872b8);color:#fff;font-size:27px;line-height:1;box-shadow:0 5px 15px #001c3888}
    .help-quick,.title-quick,.reset-quick{position:fixed;z-index:45;left:202px;font-size:25px}.title-quick{top:14px}.reset-quick{top:62px}.help-quick{top:110px}.title-quick svg,.reset-quick svg{width:27px;height:27px;fill:none;stroke:#fff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
    .ui-hidden .controls.compact-actions{display:none}.ui-hidden .title-quick{left:8px;top:8px}.ui-hidden .reset-quick{left:8px;top:56px}.ui-hidden .help-quick{left:8px;top:104px}.ui-hidden .ui-toggle{top:12px}.ui-hidden .cargo-toggle{top:56px}
    @media(max-width:760px){.controls.compact-actions{left:8px;bottom:8px}.title-quick,.reset-quick,.help-quick{left:188px}.ui-hidden .title-quick,.ui-hidden .reset-quick,.ui-hidden .help-quick{left:8px}}
  `;
  document.head.append(dockStyle);
  const controls = document.querySelector('.controls');
  const originalHelpButton = document.querySelector('#help');
  originalHelpButton.remove();
  uiToggle.remove();
  document.querySelector('#view').textContent = '⟳ 시점';
  document.querySelector('#title-screen').textContent = '⌂ 타이틀';
  controls.classList.add('compact-actions');
  const resetQuick = document.querySelector('#reset-cargo');
  resetQuick.className = 'reset-quick';
  resetQuick.title = '적재 초기화';
  resetQuick.setAttribute('aria-label', '적재 초기화');
  resetQuick.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M25.5 10.5V4.5l-4 4A11 11 0 1 0 26.7 20"/><path d="M21.5 8.5h6"/></svg>';
  document.body.append(resetQuick);
  const helpQuick = document.createElement('button');
  helpQuick.className = 'help-quick';
  helpQuick.setAttribute('aria-label', '적재 도움말');
  helpQuick.textContent = '?';
  helpQuick.onclick = () => helpBackdrop.classList.add('open');
  document.body.append(helpQuick);
  const titleQuick = document.createElement('button');
  titleQuick.className = 'title-quick';
  titleQuick.setAttribute('aria-label', '이전 화면으로 돌아가기');
  titleQuick.title = 'AI 시뮬레이션으로 돌아가기';
  titleQuick.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 6 4 16l10 10M5 16h23"/></svg>';
  titleQuick.onclick = () => { if (history.length > 1) history.back(); else location.href = 'optimizer.html'; };
  document.body.append(titleQuick);

  // Pick against the actual active loading surface. The former fixed sea-level
  // plane made a click on a visible container land in a different cell when
  // the camera was tilted, which prevented reliable stacking.
  screen = function screenOnActiveLoadingArea(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    ray.setFromCamera(pointer, camera);
    // The ship heaves, rolls and pitches with the waves. Convert the picking
    // ray into ship-local space so the clickable grid follows that motion.
    ship.updateMatrixWorld(true);
    const inverseShip = ship.matrixWorld.clone().invert();
    const localOrigin = ray.ray.origin.clone().applyMatrix4(inverseShip);
    const localTarget = ray.ray.origin.clone().add(ray.ray.direction).applyMatrix4(inverseShip);
    const localDirection = localTarget.sub(localOrigin).normalize();
    const surfaceY = loadArea === 'deck' ? deckBaseY : holdFloorY;
    const loadingPlane = new T.Plane(new T.Vector3(0, 1, 0), -surfaceY);
    const point = new T.Vector3();
    if (!new T.Ray(localOrigin, localDirection).intersectPlane(loadingPlane, point)) return null;
    const x = Math.floor(point.x / S + W / 2);
    const z = Math.floor(point.z / S + D / 2);
    return x >= 0 && x < W && z >= 0 && z < D ? [x, z] : null;
  };

  const originalHeight = height;
  height = function heightForSelectedArea(item, x, z) {
    const footprint = cells(item, x, z);
    if (footprint.some(([a, b]) => a < 0 || a >= W || b < 0 || b >= D)) return -1;
    const firstLevel = loadArea === 'deck' ? HOLD_LAYERS : 0;
    const lastLevel = loadArea === 'deck' ? H : HOLD_LAYERS;
    for (let y = firstLevel; y < lastLevel; y += 1) {
      if (footprint.some(([a, b]) => MANUAL_BLOCKED.has(`${loadArea}:${a}:${b}:${y}`))) continue;
      if (footprint.some(([a, b]) => board[a][b][y])) continue;
      if (y > firstLevel && footprint.some(([a, b]) => !board[a][b][y - 1])) continue;
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
  // These rows draw the playable upper-deck strips. They do not reserve or
  // block the corresponding cells inside the hold.
  const deckRowValues = [...new Set([0, Math.floor((D - 1) / 2), D - 1])];
  allowed = function allowedInsideOneHold(item, x, z, y) {
    const footprint = cells(item, x, z);
    const allCustomZone = (zone) => footprint.every(([cellX, cellZ]) => MANUAL_ZONES.get(`${loadArea}:${cellX}:${cellZ}:${y}`) === zone);
    if (item.t === 'flat' && allCustomZone('flat')) return true;
    if (item.t === 'reefer' && allCustomZone('reefer')) return true;
    if ((item.t === 'liquid' || item.t === 'flammable') && allCustomZone('tank')) return true;
    if (item.t === 'general') return true;
    if (item.t === 'flat' || item.t === 'reefer' || item.t === 'flammable') return loadArea === 'deck';
    if (item.t === 'liquid') return loadArea === 'hold' && y < Math.min(2, HOLD_LAYERS);
    if (item.t === 'heavy') {
      const centerX = x + (item.dir === 'x' ? (item.s - 1) / 2 : 0);
      return loadArea === 'hold' && y === 0 && Math.abs(centerX - (W - 1) / 2) <= 1;
    }
    return false;
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

  const containerHeight = (item) => Math.min(item.id.includes('HC') ? 1.5 : 1.1, levelStep * (item.id.includes('HC') ? 0.92 : 0.76));
  const stackBase = (item, x, z, y) => {
    if ((item._onDeck || loadArea === 'deck') && y === HOLD_LAYERS) return deckBaseY;
    if (y === 0) return holdFloorY;
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
    const base = item._stackBase ?? (holdFloorY + y * levelStep);
    group.position.set((x - (W - 1) / 2 + (item.dir === 'x' ? (length - 1) / 2 : 0)) * S, base + height / 2, (z - (D - 1) / 2 + (item.dir === 'z' ? (length - 1) / 2 : 0)) * S);
    item._mesh = group;
    group.traverse((part) => { part.userData.cargoItem = item; });
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
    const scoreBeforePlacement = score;
    const result = originalPlace(x, z);
    const root = y >= 0 ? board[x][z][y] : null;
    if (root?.item === item) root.gain = Math.max(0, score - scoreBeforePlacement);
    return result;
  };

  // Hover a real 3D container and press Backspace to return it to inventory.
  // A supporting container cannot be removed until every container above it
  // has been returned, which keeps the stack physically valid.
  let hoveredCargo = null;
  const setHoveredCargo = (item) => {
    if (hoveredCargo === item) return;
    const previousBody = hoveredCargo?._mesh?.children?.find((part) => part.isMesh);
    if (previousBody?.material?.emissive) previousBody.material.emissive.setHex(0x000000);
    hoveredCargo = item;
    const nextBody = hoveredCargo?._mesh?.children?.find((part) => part.isMesh);
    if (nextBody?.material?.emissive) nextBody.material.emissive.setHex(0x168fb0);
    cv.style.cursor = hoveredCargo ? 'pointer' : '';
  };
  cv.addEventListener('pointermove', (event) => {
    if (drag || ended) return setHoveredCargo(null);
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const cargoHit = ray.intersectObjects(ship.children, true).find((hit) => hit.object.userData.cargoItem);
    setHoveredCargo(cargoHit?.object.userData.cargoItem || null);
  });
  cv.addEventListener('pointerleave', () => setHoveredCargo(null));
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace' || !hoveredCargo || ended) return;
    event.preventDefault();
    let root = null;
    for (let cellX = 0; cellX < W && !root; cellX += 1) for (let cellZ = 0; cellZ < D && !root; cellZ += 1) for (let level = 0; level < H; level += 1) {
      const candidate = board[cellX][cellZ][level];
      if (candidate?.item === hoveredCargo) { root = candidate; break; }
    }
    if (!root) return setHoveredCargo(null);
    const footprint = cells(root.item, root.x, root.z);
    if (root.y + 1 < H && footprint.some(([cellX, cellZ]) => board[cellX][cellZ][root.y + 1])) {
      toast('위에 쌓인 화물을 먼저 되돌리세요.');
      return;
    }
    footprint.forEach(([cellX, cellZ]) => { if (board[cellX][cellZ][root.y] === root) board[cellX][cellZ][root.y] = null; });
    ship.remove(root.item._mesh);
    root.item._mesh?.traverse((part) => {
      part.geometry?.dispose?.();
      if (Array.isArray(part.material)) part.material.forEach((material) => material.dispose?.());
      else part.material?.dispose?.();
    });
    root.item.used = false;
    delete root.item._mesh;
    delete root.item._stackBase;
    delete root.item._onDeck;
    score = Math.max(0, score - (root.gain || 0));
    setHoveredCargo(null);
    update();
    updateDeckTransparency();
    toast(`${root.item.id} 화물을 되돌렸습니다.`);
  });

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
  const holdCenters = [-D * S * .28, 0, D * S * .28];
  holdCenters.forEach((z) => {
    addPart(new T.BoxGeometry(W * S - 1.1, 0.1, 5.25), steel, [0, holdFloorY, z]);
    addPart(new T.BoxGeometry(0.18, holdDepth, 5.35), innerWall, [-W * S / 2 + 0.4, deckBaseY-holdDepth/2, z]);
    addPart(new T.BoxGeometry(0.18, holdDepth, 5.35), innerWall, [W * S / 2 - 0.4, deckBaseY-holdDepth/2, z]);
    addPart(new T.BoxGeometry(W * S - 0.9, holdDepth, 0.18), innerWall, [0, deckBaseY-holdDepth/2, z - 2.6]);
    addPart(new T.BoxGeometry(W * S - 0.9, holdDepth, 0.18), innerWall, [0, deckBaseY-holdDepth/2, z + 2.6]);
  });
  // One continuous hold floor prevents visual gaps between cargo bays.
  addPart(new T.BoxGeometry(W * S - 1.1, 0.1, D * S - 1.0), steel, [0, holdFloorY, 0]);
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
  deckRowValues.forEach((row) => {
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
    guide.position.y = holdFloorY + level * levelStep;
    ship.add(guide);
  }

  // A high-density procedural ocean replaces the former flat striped plane.
  // Its geometry carries long swells while the fragment shader adds short
  // ripples, Fresnel sky reflection, sun glitter and restrained crest foam.
  const waterUniforms = {
    uTime: { value: 0 },
    uSunDirection: { value: new T.Vector3(-.35, .72, .58).normalize() },
    uDeepColor: { value: new T.Color(0x021a31) },
    uMidColor: { value: new T.Color(0x07577c) },
    uSkyColor: { value: new T.Color(0x98ccec) }
  };
  const waterMaterial = new T.ShaderMaterial({
    uniforms: waterUniforms,
    side: T.DoubleSide,
    transparent: false,
    extensions: { derivatives: true },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying float vCrest;
      void main() {
        vec3 p = position;
        float t = uTime;
        float w1 = sin(p.x * .105 + p.y * .065 + t * .78) * .34;
        float w2 = sin(p.x * -.055 + p.y * .14 + t * .51) * .21;
        float w3 = sin(p.x * .31 - p.y * .22 + t * 1.34) * .075;
        float w4 = sin(p.x * -.48 - p.y * .36 + t * 1.91) * .035;
        p.z += w1 + w2 + w3 + w4;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorldPosition = world.xyz;
        vCrest = w1 + w2 + w3;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDirection;
      uniform vec3 uDeepColor;
      uniform vec3 uMidColor;
      uniform vec3 uSkyColor;
      varying vec3 vWorldPosition;
      varying float vCrest;
      float ripples(vec2 p) {
        float a = sin(p.x * 1.85 + p.y * .92 + uTime * 2.1);
        float b = sin(p.x * -.73 + p.y * 2.42 - uTime * 1.7);
        float c = sin(p.x * 3.4 - p.y * 2.75 + uTime * 2.8);
        return (a + b + c) / 3.0;
      }
      void main() {
        vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
        if (!gl_FrontFacing) normal = -normal;
        float fine = ripples(vWorldPosition.xz);
        normal = normalize(normal + vec3(fine * .035, 0.0, fine * .035));
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.5);
        float horizon = pow(1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0))), 1.4);
        vec3 base = mix(uDeepColor, uMidColor, clamp(.43 + vCrest * .48 + fine * .055, 0.0, 1.0));
        base = mix(base, uSkyColor, fresnel * .72 + horizon * .12);
        vec3 halfDirection = normalize(uSunDirection + viewDirection);
        float sparkle = pow(max(dot(normal, halfDirection), 0.0), 210.0);
        sparkle *= .42 + .58 * smoothstep(.12, .92, sin(vWorldPosition.x * 5.4 + vWorldPosition.z * 3.1 + uTime * 3.0));
        float foam = smoothstep(.43, .61, vCrest + fine * .045) * .22;
        vec3 color = base + vec3(1.0, .94, .78) * sparkle * 1.9 + vec3(.72, .9, .95) * foam;
        color *= .92 + max(dot(normal, uSunDirection), 0.0) * .18;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  // Keep one continuous ocean surface below the deepest hold floor. The broad
  // mesh reaches the horizon even at the lowest permitted camera angle.
  const movingSea = new T.Mesh(new T.PlaneGeometry(260, 260, 180, 180), waterMaterial);
  movingSea.rotation.x = -Math.PI / 2;
  movingSea.position.y = Math.min(-3.74, holdFloorY - .65);
  movingSea.receiveShadow = true;
  scene.add(movingSea);

  // Completion departure: a widening pair of foam trails stays on the water
  // while the loaded ship accelerates bow-first into its new voyage.
  const wakeGroup = new T.Group();
  wakeGroup.visible = false;
  const wakeMaterial = new T.MeshBasicMaterial({
    color: 0xdaf7ff, transparent: true, opacity: 0, depthWrite: false,
    side: T.DoubleSide, blending: T.AdditiveBlending
  });
  [-1, 1].forEach((side) => {
    const wakeShape = new T.Shape();
    wakeShape.moveTo(side * .25, 0);
    wakeShape.lineTo(side * (halfBeam * .86), -14);
    wakeShape.lineTo(side * (halfBeam * .43), -14);
    wakeShape.lineTo(side * .08, 0);
    wakeShape.closePath();
    const wake = new T.Mesh(new T.ShapeGeometry(wakeShape), wakeMaterial.clone());
    wake.rotation.x = Math.PI / 2;
    wake.position.set(0, movingSea.position.y + .72, -halfLength * .84);
    wake.renderOrder = 4;
    wakeGroup.add(wake);
  });
  const centerFoam = new T.Mesh(
    new T.PlaneGeometry(Math.max(1.8, halfBeam * .7), 18, 1, 8),
    wakeMaterial.clone()
  );
  centerFoam.rotation.x = -Math.PI / 2;
  centerFoam.position.set(0, movingSea.position.y + .75, -halfLength * .84 - 8.4);
  centerFoam.renderOrder = 5;
  centerFoam.userData.centerFoam = true;
  wakeGroup.add(centerFoam);
  scene.add(wakeGroup);
  const sprayGroup = new T.Group();
  sprayGroup.visible = false;
  const sprayGeometry = new T.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 78; i += 1) {
    const spray = new T.Mesh(sprayGeometry, new T.MeshBasicMaterial({
      color: i % 4 === 0 ? 0xffffff : 0xcff5ff,
      transparent: true, opacity: 0, depthWrite: false,
      blending: T.AdditiveBlending
    }));
    spray.userData.phase = i / 78;
    spray.userData.lane = i % 2 ? -1 : 1;
    spray.userData.height = 1.1 + (i % 9) * .19;
    spray.renderOrder = 6;
    sprayGroup.add(spray);
  }
  scene.add(sprayGroup);
  const sideSprayGroup = new T.Group();
  sideSprayGroup.visible = false;
  for (let i = 0; i < 44; i += 1) {
    const splash = new T.Mesh(sprayGeometry, new T.MeshBasicMaterial({
      color: i % 5 === 0 ? 0xffffff : 0xc8f1ff,
      transparent: true, opacity: 0, depthWrite: false,
      blending: T.AdditiveBlending
    }));
    splash.userData.phase = i / 44;
    splash.userData.side = i % 2 ? -1 : 1;
    splash.renderOrder = 7;
    sideSprayGroup.add(splash);
  }
  scene.add(sideSprayGroup);

  // Soft foam stamps are revealed along the actual curved route. Unlike the
  // short live wake, these remain on the sea after the ship has passed.
  const foamCanvas = document.createElement('canvas');
  foamCanvas.width = 256; foamCanvas.height = 128;
  const foamContext = foamCanvas.getContext('2d');
  const foamGradient = foamContext.createRadialGradient(128, 64, 5, 128, 64, 118);
  foamGradient.addColorStop(0, 'rgba(255,255,255,.9)');
  foamGradient.addColorStop(.34, 'rgba(215,247,255,.64)');
  foamGradient.addColorStop(1, 'rgba(190,236,250,0)');
  foamContext.fillStyle = foamGradient; foamContext.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 38; i += 1) {
    foamContext.fillStyle = `rgba(255,255,255,${.1 + (i % 5) * .035})`;
    foamContext.beginPath();
    foamContext.arc((i * 71) % 230 + 13, (i * 43) % 104 + 12, 2 + i % 6, 0, Math.PI * 2);
    foamContext.fill();
  }
  const foamTexture = new T.CanvasTexture(foamCanvas);
  const trailGroup = new T.Group();
  const trailStamps = [];
  for (let i = 0; i < 34; i += 1) {
    const stamp = new T.Mesh(
      new T.PlaneGeometry(Math.max(3.2, halfBeam * 1.18), 5.8),
      new T.MeshBasicMaterial({ map: foamTexture, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })
    );
    stamp.rotation.x = -Math.PI / 2;
    stamp.visible = false;
    stamp.renderOrder = 3;
    trailStamps.push(stamp);
    trailGroup.add(stamp);
  }
  scene.add(trailGroup);
  let departure = null;
  window.playDeparture = (complete) => {
    if (departure) return;
    departure = {
      started: performance.now() * .001, complete,
      originX: ship.position.x, originZ: ship.position.z,
      cameraStart: camera.position.clone()
    };
    wakeGroup.visible = true;
    sprayGroup.visible = true;
    sideSprayGroup.visible = true;
    trailGroup.visible = true;
    trailStamps.forEach((stamp) => { stamp.visible = false; stamp.material.opacity = 0; });
    document.body.classList.add('departing');
  };

  // High-resolution 360-degree sky: a pale marine horizon, deep zenith and
  // soft layered clouds. It remains fixed in world space while the camera
  // orbits, avoiding the old disconnect between a rotating floor and sky.
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048; skyCanvas.height = 1024;
  const skyContext = skyCanvas.getContext('2d');
  const skyGradient = skyContext.createLinearGradient(0, 0, 0, 1024);
  skyGradient.addColorStop(0, '#287db8');
  skyGradient.addColorStop(.46, '#86c3e9');
  skyGradient.addColorStop(.69, '#d8ecf6');
  skyGradient.addColorStop(1, '#eef5f7');
  skyContext.fillStyle = skyGradient; skyContext.fillRect(0, 0, 2048, 1024);
  const cloud = (x, y, width, height, alpha) => {
    const gradient = skyContext.createRadialGradient(x, y, 0, x, y, width * .55);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(.52, `rgba(246,251,255,${alpha * .62})`);
    gradient.addColorStop(1, 'rgba(235,246,252,0)');
    skyContext.fillStyle = gradient;
    skyContext.save(); skyContext.translate(x, y); skyContext.scale(1, height / width);
    skyContext.beginPath(); skyContext.arc(0, 0, width * .55, 0, Math.PI * 2); skyContext.fill(); skyContext.restore();
  };
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 337 + 91) % 2140 - 46;
    const y = 350 + ((i * 83) % 240);
    const width = 115 + ((i * 47) % 155);
    cloud(x, y, width, width * (.32 + (i % 3) * .08), .17 + (i % 4) * .025);
  }
  const skyTexture = new T.CanvasTexture(skyCanvas);
  skyTexture.encoding = T.sRGBEncoding;
  skyTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const skyDome = new T.Mesh(
    new T.SphereGeometry(118, 64, 32),
    new T.MeshBasicMaterial({ map: skyTexture, side: T.BackSide, depthWrite: false, fog: false })
  );
  skyDome.position.y = -18;
  scene.add(skyDome);

  if (typeof harborTexture !== 'undefined') {
    harborTexture.wrapS = harborTexture.wrapT = T.RepeatWrapping;
    harborTexture.repeat.set(1.04, 1.04);
  }

  animate = function animateWithWorldMotion() {
    requestAnimationFrame(animateWithWorldMotion);
    const time = clock.getElapsedTime();
    if (departure) {
      const elapsed = performance.now() * .001 - departure.started;
      const progress = Math.min(1, elapsed / 5.35);
      const eased = progress * progress * (3 - 2 * progress);
      const driftProgress = Math.max(0, Math.min(1, (progress - .32) / .68));
      const drift = driftProgress * driftProgress * (3 - 2 * driftProgress);
      const forwardDistance = Math.max(70, D * S * 3.1);
      const leftDistance = Math.max(27, W * S * 2.8);
      ship.position.z = departure.originZ + eased * forwardDistance;
      ship.position.x = departure.originX - drift * leftDistance;
      ship.position.y = Math.sin(time * 1.45) * .055 + eased * .16;
      ship.rotation.x = -.012 - eased * .018;
      ship.rotation.y = -drift * 1.02;
      ship.rotation.z = Math.sin(time * .82) * .006 * (1 - progress) + drift * .078;
      // The camera only pans a fraction of the route. The ship therefore
      // crosses the frame and visibly shrinks into the distance instead of
      // staying locked at a constant chase-camera size.
      const cameraBase = departure.cameraStart.clone();
      cameraBase.x -= drift * 3.8;
      cameraBase.y += eased * 2.2;
      cameraBase.z += eased * 6.5;
      camera.position.lerp(cameraBase, .075);
      const cameraTarget = new T.Vector3(
        ship.position.x,
        ship.position.y + 1.05,
        ship.position.z
      );
      const shake = (.006 + drift * .024) * Math.sin(time * (19 + drift * 11));
      camera.position.x += shake;
      camera.position.y += Math.cos(time * 23) * (.004 + drift * .012);
      camera.lookAt(cameraTarget);
      wakeGroup.position.x = ship.position.x * .62;
      wakeGroup.position.z = eased * 18.5;
      wakeGroup.rotation.y = -drift * .52;
      wakeGroup.scale.set(1 + eased * .48, 1 + eased * .9, 1);
      wakeGroup.children.forEach((wake) => {
        const strength = wake.userData.centerFoam ? .82 : .72;
        wake.material.opacity = Math.sin(progress * Math.PI) * strength;
      });
      const yaw = ship.rotation.y;
      const sprayStrength = Math.min(1, progress * 4.8) * (1 - Math.max(0, progress - .94) / .06);
      sprayGroup.children.forEach((spray, index) => {
        const age = (elapsed * (1.55 + (index % 5) * .08) + spray.userData.phase) % 1;
        const spread = halfBeam * (.38 + age * .58);
        const sternLocalX = spray.userData.lane * spread + Math.sin(index * 2.17 + elapsed * 6) * .22;
        const sternLocalZ = -halfLength * .86 - age * (5.4 + eased * 7.2);
        spray.position.x = ship.position.x + sternLocalX * Math.cos(yaw) + sternLocalZ * Math.sin(yaw);
        spray.position.z = ship.position.z - sternLocalX * Math.sin(yaw) + sternLocalZ * Math.cos(yaw);
        spray.position.y = movingSea.position.y + .7 + Math.sin(age * Math.PI) * spray.userData.height * (1.85 + drift * 1.75);
        const size = .36 + age * 1.08 + eased * .25 + drift * .55;
        spray.scale.set(size * 1.8, size * (1.45 + drift * .95), size * 2.45);
        spray.material.opacity = (1 - age) * sprayStrength * .96;
      });
      sideSprayGroup.children.forEach((splash, index) => {
        const age = (elapsed * (1.75 + (index % 6) * .06) + splash.userData.phase) % 1;
        const localX = splash.userData.side * (halfBeam * (.88 + age * .18));
        const localZ = halfLength * (.64 - age * 1.25);
        splash.position.x = ship.position.x + localX * Math.cos(yaw) + localZ * Math.sin(yaw);
        splash.position.z = ship.position.z - localX * Math.sin(yaw) + localZ * Math.cos(yaw);
        splash.position.y = movingSea.position.y + .66 + Math.sin(age * Math.PI) * (1.15 + drift * 2.65);
        const crash = .22 + age * .52 + drift * .58;
        splash.scale.set(crash * 1.15, crash * (1.35 + drift), crash * .72);
        splash.material.opacity = (1 - age) * Math.min(1, progress * 5) * (.48 + drift * .48);
      });
      trailStamps.forEach((stamp, index) => {
        const routeT = index / (trailStamps.length - 1);
        if (routeT > progress) return;
        const routeEase = routeT * routeT * (3 - 2 * routeT);
        const routeDriftProgress = Math.max(0, Math.min(1, (routeT - .32) / .68));
        const routeDrift = routeDriftProgress * routeDriftProgress * (3 - 2 * routeDriftProgress);
        stamp.visible = true;
        stamp.position.set(
          departure.originX - routeDrift * leftDistance,
          movingSea.position.y + .76,
          departure.originZ + routeEase * forwardDistance - halfLength * .78
        );
        stamp.rotation.z = routeDrift * .92;
        stamp.scale.set(1 + routeDrift * .65, 1 + eased * .34, 1);
        const trailAgeSeconds = Math.max(0, elapsed - routeT * 5.35);
        stamp.material.opacity = Math.max(0, .84 - trailAgeSeconds * .52);
      });
      waterUniforms.uTime.value = time * (1 + eased * .55);
      if (progress >= 1) {
        const complete = departure.complete;
        departure = null;
        wakeGroup.visible = false;
        sprayGroup.visible = false;
        sideSprayGroup.visible = false;
        trailGroup.visible = false;
        document.body.classList.remove('departing');
        complete();
      }
    } else if (!ended) {
      const heave = Math.sin(time * .72) * .045 + Math.sin(time * 1.27) * .015;
      const roll = Math.sin(time * .58) * .009;
      const pitch = Math.sin(time * .43 + .8) * .006;
      ship.position.y = heave;
      ship.rotation.z = roll;
      ship.rotation.x = pitch;
      movingSea.position.x = -Math.sin(time * .19) * .32;
      movingSea.position.z = -Math.cos(time * .16) * .42;
      waterUniforms.uTime.value = time;
      if (typeof harborTexture !== 'undefined') {
        harborTexture.offset.x = .02 + Math.sin(time * .22) * .012 - roll * .35;
        harborTexture.offset.y = .01 + Math.sin(time * .43) * .006 - heave * .035;
      }
    }
    renderer.render(scene, camera);
  };
});
