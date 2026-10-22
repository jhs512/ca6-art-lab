const $ = (id) => document.getElementById(id);
const data = await (await fetch("manifest.json")).json();
const images = new Map(),
    packs = data.packs,
    actors = data.actors,
    biomes = data.biomes;
let paused = matchMedia("(prefers-reduced-motion: reduce)").matches,
    showOriginal = false,
    manualFrame = 0,
    angle = 0,
    scale = 1,
    biome = "grass",
    travel = true,
    detail = null;
let choices;
try {
    choices = JSON.parse(localStorage.getItem("ca6-art-lab-v1") || "{}");
} catch {
    choices = {};
}
choices.assets ||= {};
choices.pack ||= "";
choices.notes ||= "";
const save = () => {
    try {
        localStorage.setItem("ca6-art-lab-v1", JSON.stringify(choices));
        $("saved").textContent = "이 브라우저에 저장했습니다.";
    } catch {
        $("saved").textContent = "저장 공간을 사용할 수 없습니다. 선택 내보내기를 이용하세요.";
    }
};
function load(file) {
    if (!file) return;
    const image = new Image();
    image.src = file;
    images.set(file, image);
    return image.decode().catch(() => images.delete(file));
}
const jobs = [];
for (const pack of packs) {
    for (const actor of actors) {
        const entry = pack.actors[actor.id];
        if (entry) {
            jobs.push(load(entry.base));
            for (const frame of entry.frames) jobs.push(load(frame));
        }
    }
    for (const id of Object.keys(pack.backgrounds)) jobs.push(load(pack.backgrounds[id]));
}
const loaded = Promise.all(jobs);
const completed = packs.reduce(
    (n, p) => n + actors.filter((a) => p.actors[a.id]?.frames.length === 8).length,
    0,
);
loaded.then(() => {
    const clips = packs.reduce((n,p)=>n+actors.filter(a=>{
        const entry=p.actors[a.id];
        return entry?.frames.length===8 && [entry.base,...entry.frames].every(f=>images.get(f)?.naturalWidth>0);
    }).length,0);
    const backgrounds=packs.reduce((n,p)=>n+Object.values(p.backgrounds).filter(f=>images.get(f)?.naturalWidth>0).length,0);
    $("coverage").dataset.loadedClips=clips;
    $("coverage").dataset.loadedBackgrounds=backgrounds;
    $("coverage").textContent =
        `${clips} / ${packs.length * actors.length} 대표 동작 · ${backgrounds} / ${packs.length * biomes.length} 배경 구성`;
});
const visiblePacks = new Set(packs.map(p => p.id));
for (const pack of packs) {
    const label = document.createElement('label'), input = document.createElement('input');
    input.type='checkbox'; input.checked=true; input.value=pack.id;
    input.onchange=()=>{
        if (!input.checked && visiblePacks.size===1) { input.checked=true; return; }
        if (input.checked) visiblePacks.add(pack.id); else visiblePacks.delete(pack.id);
        document.querySelectorAll('[data-pack]').forEach(el=>el.hidden=!visiblePacks.has(el.dataset.pack));
        document.documentElement.style.setProperty('--compare-count',visiblePacks.size);
    };
    label.append(input,`${pack.letter} · ${pack.label}`); $('pack-filters').append(label);
    const option=document.createElement('option'); option.value=pack.id; option.textContent=`${pack.letter} 배경으로 통일`;
    if (!['plain','styled','painted'].includes(pack.id)) $('background-source').append(option);
}
document.documentElement.style.setProperty('--compare-count',packs.length);
const labels=document.querySelector('.column-labels'); labels.replaceChildren();
labels.append(Object.assign(document.createElement('span'),{textContent:'비교 대상'}));
for (const pack of packs) { const label=document.createElement('b');label.textContent=`${pack.letter} · ${pack.label}`;label.dataset.pack=pack.id;labels.append(label); }
for (const b of biomes) {
    const button = document.createElement("button");
    button.textContent = b.label;
    button.dataset.id = b.id;
    button.className = b.id === biome ? "active" : "";
    button.onclick = () => {
        biome = b.id;
        for (const el of $("biomes").children) el.classList.toggle("active", el === button);
    };
    $("biomes").append(button);
}
const stageViews = [],
    assetViews = [];
for (const pack of packs) {
    const card = document.createElement("article");
    card.className = "pack";
    card.dataset.pack = pack.id;
    card.innerHTML = `<div class="pack-head"><span class="letter">${pack.letter}</span><div><h3>${pack.label}</h3><small>${pack.subtitle}</small><small class="view-note">시점 · ${pack.viewNote}</small></div></div><canvas class="stage-canvas" width="1024" height="640" aria-label="${pack.label} 10종 대표 동작"></canvas><div class="pack-foot"><span>동일한 월드 크기 · 대표 동작</span><span>8프레임 / 10fps</span></div>`;
    $("stages").append(card);
    stageViews.push({ canvas: card.querySelector("canvas"), pack });
    const button = document.createElement("button");
    button.textContent = `${pack.letter} · ${pack.label}`;
    button.classList.toggle("selected", choices.pack === pack.id);
    button.onclick = () => {
        choices.pack = choices.pack === pack.id ? "" : pack.id;
        for (const b of $("votes").children)
            b.classList.toggle("selected", b === button && choices.pack === pack.id);
        save();
    };
    $("votes").append(button);
}
for (const actor of actors) {
    const row = document.createElement("div");
    row.className = "actor-row";
    const title = document.createElement("div");
    title.className = "actor-name";
    title.innerHTML = `<h3>${actor.label}</h3><p>${actor.original}</p><p>${actor.actionLabel}</p>`;
    row.append(title);
    for (const pack of packs) {
        const entry = pack.actors[actor.id],
            card = document.createElement("div");
        card.className = "asset";
        card.dataset.pack = pack.id;
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 310;
        canvas.setAttribute("aria-label", `${pack.letter} ${actor.label} 움직임 확대`);
        canvas.tabIndex = 0;
        const info = document.createElement("div");
        info.className = "asset-info";
        const label = document.createElement("span");
        label.textContent = entry?.frames.length
            ? `${pack.letter} · ${entry.frames.length}프레임 · ${entry.uniqueFrames}장 고유 이미지`
            : "동작 미완료";
        const button = document.createElement("button");
        button.className = "star";
        button.textContent = "☆";
        const key = actor.id + ":" + pack.id;
        const update = () => {
            const selected = !!choices.assets[key];
            button.classList.toggle("selected", selected);
            button.textContent = selected ? "★" : "☆";
            button.setAttribute("aria-label", `${pack.letter} ${actor.label} 선택`);
            button.setAttribute("aria-pressed", String(selected));
        };
        update();
        button.onclick = () => {
            choices.assets[key] = !choices.assets[key];
            update();
            save();
        };
        info.append(label, button);
        card.append(canvas, info);
        row.append(card);
        assetViews.push({ canvas, pack, actor });
        const open = () => {
            detail = { pack, actor };
            $("detail-title").textContent = `${pack.letter} · ${actor.label}`;
            $("detail-meta").textContent =
                `${actor.actionLabel} · 월드 기준 크기 ${actor.extent}px · 프레임별 개별 확대 없음`;
            $("detail").showModal();
        };
        canvas.onclick = open;
        canvas.onkeydown = (e) => {
            if (e.key === "Enter") open();
        };
    }
    $("actors").append(row);
}
for (const b of biomes) {
    const row = document.createElement("div");
    row.className = "terrain-row";
    row.innerHTML = `<h3>${b.label}</h3>`;
    const grid = document.createElement("div");
    grid.className = "terrain-grid";
    for (const p of packs) {
        const card = document.createElement("figure");
        card.className = "terrain-card";
        card.dataset.pack = p.id;
        const image = document.createElement("img");
        image.src = p.backgrounds[b.id] || "";
        image.alt = `${p.letter} ${b.label} 배경`;
        image.loading = "lazy";
        const caption = document.createElement("figcaption");
        caption.textContent = p.letter + " · " + p.label;
        const vote = document.createElement("button");
        vote.className = "star";
        const key = "background:" + b.id + ":" + p.id;
        const update = () => {
            vote.textContent = choices.assets[key] ? "★" : "☆";
            vote.classList.toggle("selected", !!choices.assets[key]);
            vote.setAttribute("aria-label", p.letter + " " + b.label + " 배경 선택");
            vote.setAttribute("aria-pressed", String(!!choices.assets[key]));
        };
        update();
        vote.onclick = () => {
            choices.assets[key] = !choices.assets[key];
            update();
            save();
        };
        caption.append(vote);
        card.append(image, caption);
        grid.append(card);
    }
    row.append(grid);
    $("terrain").append(row);
}
$("notes").value = choices.notes;
$("notes").oninput = () => {
    choices.notes = $("notes").value;
    save();
};
$("export").onclick = () => {
    const blob = new Blob(
            [
                JSON.stringify(
                    { experiment: data.id, exportedAt: new Date().toISOString(), ...choices },
                    null,
                    2,
                ),
            ],
            { type: "application/json" },
        ),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
    link.href = url;
    link.download = "ca6-art-choice.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("play").textContent = paused ? "▶ 재생" : "Ⅱ 일시 정지";
$("play").setAttribute("aria-pressed", String(paused));
$("play").onclick = () => {
    if (paused) elapsed = manualFrame * 100;
    else manualFrame = Math.max(0, lastFrame);
    paused = !paused;
    $("play").textContent = paused ? "▶ 재생" : "Ⅱ 일시 정지";
    $("play").setAttribute("aria-pressed", String(paused));
};
$("scale").onchange = () => (scale = +$("scale").value);
$("angle").oninput = () => {
    angle = +$("angle").value;
    $("degrees").value = angle + "°";
};
$("frame").oninput = () => {
    paused = true;
    manualFrame = +$("frame").value;
    $("play").textContent = "▶ 재생";
    $("play").setAttribute("aria-pressed", "true");
};
$("original").onclick = () => {
    showOriginal = !showOriginal;
    $("original").textContent = showOriginal ? "동작으로 돌아가기" : "기준 원화 보기";
    $("original").setAttribute("aria-pressed", String(showOriginal));
};
$("motion").onclick = () => {
    travel = !travel;
    $("motion").textContent = travel ? "움직임 + 이동" : "제자리 동작";
};
$("close-detail").onclick = () => $("detail").close();
$("detail").onclick = (e) => {
    if (e.target === $("detail")) $("detail").close();
};
function drawActor(ctx, pack, actor, x, y, frame, zoom = 1, rotation = angle) {
    const entry = pack.actors[actor.id];
    if (!entry) return;
    const file = showOriginal ? entry.base : entry.frames[frame] || entry.base,
        image = images.get(file);
    if (!image || !image.complete || image.naturalWidth === 0) return;
    const factor = (actor.extent / entry.referenceExtent) * zoom;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.imageSmoothingEnabled = pack.id === "painted" || !!pack.smoothing;
    ctx.drawImage(
        image,
        -entry.anchor[0] * factor,
        -entry.anchor[1] * factor,
        image.width * factor,
        image.height * factor,
    );
    ctx.restore();
}
const points = [
    [65, 65],
    [190, 65],
    [315, 65],
    [440, 65],
    [65, 155],
    [190, 155],
    [315, 155],
    [440, 155],
    [115, 278],
    [355, 245],
];
let elapsed = 0,
    previous = performance.now(),
    lastFrame = -1;
function paint(now) {
    if (!paused) elapsed += Math.min(100, now - previous);
    previous = now;
    const frame = paused ? manualFrame : Math.floor(elapsed / 100) % 8;
    if (frame !== lastFrame) {
        $("frame-label").value = `${frame + 1} / 8`;
        if (!paused) $("frame").value = frame;
        lastFrame = frame;
    }
    for (const { canvas, pack } of stageViews) {
        if (!visiblePacks.has(pack.id)) continue;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(2, 0, 0, 2, 0, 0);
        ctx.clearRect(0, 0, 512, 320);
        const backgroundPack =
            $("background-source").value === "own"
                ? pack
                : packs.find((p) => p.id === $("background-source").value);
        const bg = images.get(backgroundPack.backgrounds[biome]);
        if (bg?.complete && bg.naturalWidth) ctx.drawImage(bg, 0, 0, 512, 320);
        else {
            ctx.fillStyle = "#dbe4d0";
            ctx.fillRect(0, 0, 512, 320);
        }
        for (const [i, a] of actors.entries()) {
            const [x, y] = points[i],
                offset = travel ? Math.sin(elapsed / 1000) * 13 : 0;
            drawActor(ctx, pack, a, x + offset, y, frame, scale);
            ctx.font = "9px sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#10291ac9";
            const w = ctx.measureText(a.label).width + 12;
            const labelY = Math.min(305, y + Math.min(a.extent * scale, 120) / 2 + 8);
            ctx.fillRect(x + offset - w / 2, labelY, w, 15);
            ctx.fillStyle = "#fff";
            ctx.fillText(a.label, x + offset, labelY + 11);
        }
    }
    for (const view of assetViews) {
        if (!visiblePacks.has(view.pack.id)) continue;
        const ctx = view.canvas.getContext("2d");
        ctx.clearRect(0, 0, 360, 310);
        const extent = view.actor.id === "raft" ? 1.3 : 2.6;
        drawActor(ctx, view.pack, view.actor, 180, 150, frame, extent);
    }
    if (detail && $("detail").open) {
        const ctx = $("detail-canvas").getContext("2d");
        ctx.clearRect(0, 0, 640, 400);
        drawActor(
            ctx,
            detail.pack,
            detail.actor,
            320,
            200,
            frame,
            detail.actor.id === "raft" ? 2.5 : 5,
        );
    }
    requestAnimationFrame(paint);
}
requestAnimationFrame(paint);
