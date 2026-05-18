"use strict";

const sampleDirective = {
  "叙事核心": "春节前夜的家庭团圆场景。画面重点是长辈与晚辈共同准备年夜饭，氛围温暖、秩序感强，并保留传统家庭空间中的生活痕迹。",
  "视觉锚点列表": [
    {
      "对象名称": "圆桌与年夜饭",
      "包含描述": "圆桌上有热菜、鱼、饺子和小碗，菜品数量丰富但不夸张，桌面保持家庭用餐的真实状态。",
      "空间关系": "位于画面中心偏下，家庭成员围坐或站在周边。",
      "文化标签": ["团圆", "年夜饭", "家庭秩序"]
    },
    {
      "对象名称": "红色春联与窗花",
      "包含描述": "门框两侧贴有手写感春联，窗户上贴剪纸窗花，红色元素清晰但不过度覆盖画面。",
      "空间关系": "位于背景墙面和窗户区域，作为空间身份提示。",
      "文化标签": ["春节", "民俗装饰", "节庆"]
    }
  ],
  "情感与氛围": {
    "情感关键词": ["克制的喜庆", "亲密", "烟火气"],
    "视觉锚定描述": "暖色室内光线，人物表情自然，动作以协作和照看为主，避免舞台化摆拍。"
  },
  "禁忌与衰减规则": {
    "绝对禁忌": ["不要使用日本和服、鸟居、浮世绘等非目标文化符号", "不要把春节场景处理成商业海报或奢华宴会"],
    "衰减规则": ["减少霓虹灯和赛博朋克光效", "减少夸张烟花占比，保留室内家庭叙事"]
  },
  "空间构图": "中景视角，人物和圆桌形成稳定三角构图；背景保留门框、窗户、柜子等家庭空间线索。"
};

const AI_TRANSLATE_ENDPOINT = "https://ai-assistant-proxy.ziyuet97.workers.dev/";

const state = {
  directive: normalizeDirective(sampleDirective),
  modifications: [],
  isSubmitting: false,
  translationResult: null,
  importOpen: false,
  lastMessage: "本地草稿"
};

const icons = {
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 20 4l-7 16-2-7-7-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v11H8zM5 16H4V4h12v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M18 13l-6 6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2M4 5v6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function pathToken(path) {
  return encodeURIComponent(JSON.stringify(path));
}

function parsePathToken(token) {
  return JSON.parse(decodeURIComponent(token));
}

function samePath(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasPath(path) {
  return state.modifications.some((item) => samePath(item, path));
}

function isUserAdded(pathPrefix) {
  return state.modifications.some((item) => {
    if (item.length < pathPrefix.length + 1) return false;
    return pathPrefix.every((segment, index) => item[index] === segment) && item.includes("new");
  });
}

function recordModification(path) {
  if (!hasPath(path)) {
    state.modifications = [...state.modifications, path];
  }
}

function getAtPath(source, path) {
  return path.reduce((target, segment) => (target == null ? undefined : target[segment]), source);
}

function updateField(path, value) {
  const next = clone(state.directive);
  let target = next;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (target[key] == null) target[key] = typeof path[index + 1] === "number" ? [] : {};
    target = target[key];
  }
  target[path[path.length - 1]] = value;
  state.directive = next;
  recordModification(path);
}

function normalizeDirective(input) {
  const raw = clone(input || {});
  const directive = { ...raw };

  const narrative = pick(raw, ["叙事核心", "叙事核心句", "narrative_core", "narrativeCore"]);
  const anchors = pick(raw, ["视觉锚点列表", "visual_anchors", "visualAnchors"]);
  const atmosphere =
    pick(raw, ["情感与氛围", "emotion_atmosphere", "affective_atmosphere", "atmosphere"]) ?? {
      "情感关键词": pick(raw, ["情感调性", "emotion_tone", "emotional_tone"]),
      "视觉锚定描述": pick(raw, ["视觉情感锚定", "visual_emotional_anchor", "visual_emotion_anchor"])
    };
  const rules = pick(raw, ["禁忌与衰减规则", "taboos_decay_rules", "taboo_and_decay_rules", "rules"]);
  const composition = pick(raw, ["空间构图", "spatial_composition", "composition"]);
  const memoryAnchors = pick(raw, ["核心记忆锚点", "core_memory_anchors", "memory_anchors"]);
  const sensoryAnchors = pick(raw, ["感知锚定", "sensory_anchoring", "perceptual_anchors"]);
  const contextRelation = pick(raw, ["上下文关系", "context_relation", "contextual_relation"]);

  delete directive["叙事核心句"];
  delete directive.narrative_core;
  delete directive.narrativeCore;
  delete directive.visual_anchors;
  delete directive.visualAnchors;
  delete directive["情感调性"];
  delete directive["视觉情感锚定"];
  delete directive.emotion_atmosphere;
  delete directive.affective_atmosphere;
  delete directive.atmosphere;
  delete directive.emotion_tone;
  delete directive.emotional_tone;
  delete directive.visual_emotional_anchor;
  delete directive.visual_emotion_anchor;
  delete directive.taboos_decay_rules;
  delete directive.taboo_and_decay_rules;
  delete directive.rules;
  delete directive.spatial_composition;
  delete directive.composition;
  delete directive.core_memory_anchors;
  delete directive.memory_anchors;
  delete directive.sensory_anchoring;
  delete directive.perceptual_anchors;
  delete directive.context_relation;
  delete directive.contextual_relation;
  delete directive["用户修改标记"];
  delete directive.user_modifications;

  directive["叙事核心"] = String(narrative ?? "");
  directive["核心记忆锚点"] = normalizeStringArray(memoryAnchors);
  directive["感知锚定"] = normalizeSensoryAnchors(sensoryAnchors);
  directive["视觉锚点列表"] = normalizeAnchors(anchors);
  directive["情感与氛围"] = normalizeAtmosphere(atmosphere);
  directive["禁忌与衰减规则"] = normalizeRules(rules);
  directive["上下文关系"] = String(contextRelation ?? "");
  directive["空间构图"] = String(composition ?? "");

  return directive;
}

function pick(source, keys) {
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  return undefined;
}

function normalizeAnchors(value) {
  const list = Array.isArray(value) ? value : [];
  return list.map((item) => ({
    "对象名称": String(pick(item, ["对象名称", "对象", "object_name", "name", "object"]) ?? ""),
    "包含描述": String(pick(item, ["包含描述", "included_description", "description", "content"]) ?? ""),
    "空间关系": String(pick(item, ["空间关系", "spatial_relation", "relationship"]) ?? ""),
    "文化标签": normalizeStringArray(pick(item, ["文化标签", "culture_tags", "cultural_tags", "tags"]))
  }));
}

function normalizeAtmosphere(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    "情感关键词": normalizeStringArray(pick(source, ["情感关键词", "emotion_keywords", "keywords"])),
    "视觉锚定描述": String(pick(source, ["视觉锚定描述", "visual_anchor_description", "visual_description", "description"]) ?? "")
  };
}

function normalizeRules(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    "绝对禁忌": normalizeStringArray(pick(source, ["绝对禁忌", "absolute_taboos", "taboos", "forbidden"])),
    "衰减规则": normalizeStringArray(pick(source, ["衰减规则", "decay_rules", "soft_constraints", "deemphasis"]))
  };
}

function normalizeSensoryAnchors(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key).trim(), stringifyDirectiveItem(item)])
      .filter(([key, item]) => key && item)
  );
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stringifyDirectiveItem(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[，、,;；\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function stringifyDirectiveItem(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyDirectiveItem(item)).filter(Boolean).join("，");
  if (typeof value === "object") {
    if ("元素" in value || "处理" in value) {
      return [`元素：${value["元素"] ?? ""}`, `处理：${value["处理"] ?? ""}`]
        .filter((item) => !item.endsWith("："))
        .join("；");
    }
    return Object.entries(value)
      .map(([key, item]) => `${key}：${stringifyDirectiveItem(item)}`)
      .filter((item) => !item.endsWith("："))
      .join("；");
  }
  return String(value).trim();
}

function finalPayload() {
  return {
    ...state.directive,
    "用户修改标记": state.modifications,
    user_modifications: state.modifications
  };
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="app-header">
      <div class="header-inner">
        <div class="title-block">
          <h1>文化指令确认卡</h1>
          <div class="meta-line">
            <span class="status-pill ready">离线可编辑</span>
            <span class="status-pill" id="modCountPill">${state.modifications.length} 项用户修改</span>
            <span class="status-pill">${escapeHtml(state.lastMessage)}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="secondary-btn" data-action="open-import">${buttonIcon("upload")}导入JSON</button>
          <button class="secondary-btn" data-action="export-json">${buttonIcon("download")}导出JSON</button>
          <button class="primary-btn" data-action="confirm-translate" ${state.isSubmitting ? "disabled" : ""}>${buttonIcon("send")}${state.isSubmitting ? "生成中" : "确认并生成"}</button>
        </div>
      </div>
    </header>
    <main class="shell">
      <div class="workspace">
        <div class="editor">
          ${renderNarrative()}
          ${renderMemoryContext()}
          ${renderAnchors()}
          ${renderAtmosphere()}
          ${renderRules()}
          ${renderComposition()}
          <div class="action-zone">
            <button class="primary-btn" data-action="confirm-translate" ${state.isSubmitting ? "disabled" : ""}>${buttonIcon("send")}${state.isSubmitting ? "生成中" : "确认并生成"}</button>
            <button class="secondary-btn" data-action="export-json">${buttonIcon("download")}导出JSON</button>
            <button class="ghost-btn" data-action="reset-dialogue">${buttonIcon("reset")}重新对话</button>
          </div>
        </div>
        ${renderSidePanel()}
      </div>
    </main>
    ${state.importOpen ? renderImportModal() : ""}
    <input class="hidden-input" id="fileInput" type="file" accept="application/json,.json" />
  `;
}

function renderNarrative() {
  return `
    <section class="section">
      <div class="section-head">
        <h2>叙事核心</h2>
      </div>
      ${textAreaField(["叙事核心"], "narrative_core", state.directive["叙事核心"], 5)}
    </section>
  `;
}

function renderMemoryContext() {
  const sensory = state.directive["感知锚定"] || {};
  const entries = Object.entries(sensory);

  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>记忆与感知锚定</h2>
          <div class="section-count">${entries.length} 个感知锚定</div>
        </div>
        <button class="secondary-btn" data-action="add-sensory">${buttonIcon("plus")}添加感知锚定</button>
      </div>
      ${tagEditor(["核心记忆锚点"], "核心记忆锚点", state.directive["核心记忆锚点"] || [])}
      <div class="cards-list">
        ${entries.length ? entries.map(([name, description]) => renderSensoryAnchor(name, description)).join("") : emptyState("暂无感知锚定")}
      </div>
      ${textAreaField(["上下文关系"], "上下文关系", state.directive["上下文关系"] || "", 4)}
    </section>
  `;
}

function renderSensoryAnchor(name, description) {
  const path = ["感知锚定", name];
  return `
    <article class="anchor-card">
      <div class="card-head">
        <div class="card-title">
          <strong>感知锚定</strong>
          ${sourceBadge(path)}
        </div>
        <div class="card-actions">
          <button class="icon-btn danger" data-action="remove-sensory" data-key="${escapeAttr(name)}" title="删除感知锚定" aria-label="删除感知锚定">${buttonIcon("trash")}</button>
        </div>
      </div>
      <div class="anchor-grid">
        <label class="compact-field">
          <span class="field-label">锚点名称</span>
          <input data-action="rename-sensory-key" data-key="${escapeAttr(name)}" value="${escapeAttr(name)}" />
        </label>
        <div class="field-wide">
          ${textAreaField(path, "感知描述", description, 3)}
        </div>
      </div>
    </article>
  `;
}

function renderAnchors() {
  const anchors = state.directive["视觉锚点列表"] || [];
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>视觉锚点列表</h2>
          <div class="section-count">${anchors.length} 个锚点</div>
        </div>
        <button class="secondary-btn" data-action="add-anchor">${buttonIcon("plus")}添加新锚点</button>
      </div>
      <div class="cards-list">
        ${anchors.length ? anchors.map((anchor, index) => renderAnchor(anchor, index)).join("") : emptyState("暂无视觉锚点")}
      </div>
    </section>
  `;
}

function renderAnchor(anchor, index) {
  const itemPath = ["视觉锚点列表", index];
  const itemBadge = isUserAdded(itemPath)
    ? '<span class="source-badge source-new">用户新增</span>'
    : '<span class="source-badge source-ai">AI提取</span>';

  return `
    <article class="anchor-card">
      <div class="card-head">
        <div class="card-title">
          <strong>锚点 ${index + 1}</strong>
          ${itemBadge}
        </div>
        <div class="card-actions">
          <button class="icon-btn danger" data-action="remove-anchor" data-index="${index}" title="删除锚点" aria-label="删除锚点">${buttonIcon("trash")}</button>
        </div>
      </div>
      <div class="anchor-grid">
        ${inputField([...itemPath, "对象名称"], "对象名称", anchor["对象名称"])}
        ${inputField([...itemPath, "空间关系"], "空间关系", anchor["空间关系"])}
        <div class="field-wide">
          ${textAreaField([...itemPath, "包含描述"], "包含描述", anchor["包含描述"], 4)}
        </div>
        <div class="field-wide">
          ${tagEditor([...itemPath, "文化标签"], "文化标签", anchor["文化标签"] || [])}
        </div>
      </div>
    </article>
  `;
}

function renderAtmosphere() {
  const atmosphere = state.directive["情感与氛围"] || {};
  return `
    <section class="section">
      <div class="section-head">
        <h2>情感与氛围</h2>
      </div>
      ${tagEditor(["情感与氛围", "情感关键词"], "情感关键词", atmosphere["情感关键词"] || [])}
      ${textAreaField(["情感与氛围", "视觉锚定描述"], "视觉锚定描述", atmosphere["视觉锚定描述"] || "", 4)}
    </section>
  `;
}

function renderRules() {
  const rules = state.directive["禁忌与衰减规则"] || {};
  const taboos = rules["绝对禁忌"] || [];
  const decays = rules["衰减规则"] || [];

  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>禁忌与衰减规则</h2>
          <div class="section-count">${taboos.length} 条绝对禁忌，${decays.length} 条衰减规则</div>
        </div>
        <div class="toolbar">
          <button class="secondary-btn" data-action="add-taboo">${buttonIcon("plus")}添加禁忌</button>
          <button class="secondary-btn" data-action="add-decay">${buttonIcon("plus")}添加衰减规则</button>
        </div>
      </div>
      <div class="rules-list">
        ${taboos.map((item, index) => renderRule("绝对禁忌", item, index)).join("")}
        ${decays.map((item, index) => renderRule("衰减规则", item, index)).join("")}
        ${!taboos.length && !decays.length ? emptyState("暂无规则") : ""}
      </div>
    </section>
  `;
}

function renderRule(type, value, index) {
  const isTaboo = type === "绝对禁忌";
  const path = ["禁忌与衰减规则", type, index];
  return `
    <article class="rule-card">
      <div class="rule-head">
        <div class="card-title">
          <span class="rule-type ${isTaboo ? "taboo" : "decay"}">${type}</span>
          ${sourceBadge(path)}
        </div>
        <div class="row-actions">
          <button class="secondary-btn" data-action="${isTaboo ? "demote-taboo" : "promote-decay"}" data-index="${index}" title="${isTaboo ? "降为衰减规则" : "升为绝对禁忌"}">
            ${buttonIcon(isTaboo ? "arrowDown" : "arrowUp")}${isTaboo ? "降级" : "升级"}
          </button>
          <button class="icon-btn danger" data-action="${isTaboo ? "remove-taboo" : "remove-decay"}" data-index="${index}" title="删除规则" aria-label="删除规则">${buttonIcon("trash")}</button>
        </div>
      </div>
      ${textAreaField(path, "规则内容", value, 3)}
    </article>
  `;
}

function renderComposition() {
  return `
    <section class="section">
      <div class="section-head">
        <h2>空间构图</h2>
        <span class="section-count">高级项</span>
      </div>
      ${textAreaField(["空间构图"], "构图描述", state.directive["空间构图"] || "", 4)}
    </section>
  `;
}

function renderSidePanel() {
  return `
    <aside class="side-panel">
      <div class="side-section">
        <h3>用户修改标记</h3>
        <ul class="mod-list" id="modList">${renderModifications()}</ul>
      </div>
      <div class="side-section">
        <div class="result-actions">
          <h3>当前JSON</h3>
          <button class="icon-btn" data-action="copy-json" title="复制JSON" aria-label="复制JSON">${buttonIcon("copy")}</button>
        </div>
        <pre class="json-preview" id="jsonPreview">${escapeHtml(JSON.stringify(finalPayload(), null, 2))}</pre>
      </div>
      <div class="side-section">
        <div class="result-actions">
          <h3>生成结果</h3>
          ${state.translationResult ? `<button class="icon-btn" data-action="copy-result" title="复制生成结果" aria-label="复制生成结果">${buttonIcon("copy")}</button>` : ""}
        </div>
        ${renderTranslationResult()}
      </div>
    </aside>
  `;
}

function renderTranslationResult() {
  const result = state.translationResult;
  if (!result) {
    return '<div class="empty-state">尚未生成</div>';
  }
  return `
    <div class="result-block">
      <div class="result-label">forward_prompt</div>
      <pre class="result-box">${escapeHtml(result.forward_prompt ?? "")}</pre>
    </div>
    <div class="result-block">
      <div class="result-label">negative_prompt</div>
      <pre class="result-box">${escapeHtml(result.negative_prompt ?? "")}</pre>
    </div>
    <div class="result-block">
      <div class="result-label">generation_params</div>
      <pre class="result-box">${escapeHtml(JSON.stringify(result.generation_params ?? {}, null, 2))}</pre>
    </div>
  `;
}

function renderModifications() {
  if (!state.modifications.length) {
    return '<li>暂无用户修改</li>';
  }
  return state.modifications
    .slice(-12)
    .reverse()
    .map((path) => `<li>${escapeHtml(formatPath(path))}</li>`)
    .join("");
}

function renderImportModal() {
  return `
    <div class="import-modal" role="dialog" aria-modal="true" aria-labelledby="importTitle">
      <div class="modal-panel">
        <div class="modal-head">
          <h2 id="importTitle">导入JSON</h2>
          <button class="icon-btn" data-action="close-import" title="关闭" aria-label="关闭">${buttonIcon("close")}</button>
        </div>
        <textarea class="import-textarea" id="importTextarea" spellcheck="false">${escapeHtml(JSON.stringify(sampleDirective, null, 2))}</textarea>
        <div class="action-row">
          <button class="secondary-btn" data-action="choose-file">${buttonIcon("upload")}选择文件</button>
          <button class="primary-btn" data-action="apply-import">载入</button>
          <button class="ghost-btn" data-action="close-import">取消</button>
        </div>
      </div>
    </div>
  `;
}

function inputField(path, label, value) {
  const token = pathToken(path);
  return `
    <label class="compact-field">
      <span class="field-label">${escapeHtml(label)} ${sourceBadge(path)}</span>
      <input data-action="update-field" data-path="${token}" value="${escapeAttr(value)}" />
    </label>
  `;
}

function textAreaField(path, label, value, rows) {
  const token = pathToken(path);
  return `
    <label class="field">
      <span class="field-label">${escapeHtml(label)} ${sourceBadge(path)}</span>
      <textarea data-action="update-field" data-path="${token}" rows="${rows}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function tagEditor(path, label, tags) {
  const token = pathToken(path);
  const tagItems = tags
    .map((tag, index) => `
      <span class="tag">
        <span>${escapeHtml(tag)}</span>
        <button class="tag-remove" data-action="remove-tag" data-path="${token}" data-index="${index}" title="删除标签" aria-label="删除标签">${buttonIcon("close")}</button>
      </span>
    `)
    .join("");

  return `
    <div class="field">
      <div class="field-label">${escapeHtml(label)} ${sourceBadge(path)}</div>
      <div class="tag-list">${tagItems || '<span class="section-count">暂无标签</span>'}</div>
      <div class="tag-editor">
        <input class="tag-input" data-role="tag-input" data-path="${token}" placeholder="输入标签" />
        <button class="secondary-btn" data-action="add-tag" data-path="${token}">${buttonIcon("plus")}添加</button>
      </div>
    </div>
  `;
}

function sourceBadge(path) {
  const modified = hasPath(path);
  return `<span class="source-badge ${modified ? "source-user" : "source-ai"}" data-source-path="${pathToken(path)}">${modified ? "用户修改" : "AI提取"}</span>`;
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function buttonIcon(name) {
  return `<span class="button-icon">${icons[name] || ""}</span>`;
}

function formatPath(path) {
  return path.map((segment) => (typeof segment === "number" ? segment + 1 : segment)).join(" / ");
}

function refreshLivePanels() {
  const jsonPreview = document.getElementById("jsonPreview");
  if (jsonPreview) jsonPreview.textContent = JSON.stringify(finalPayload(), null, 2);

  const modList = document.getElementById("modList");
  if (modList) modList.innerHTML = renderModifications();

  const modCountPill = document.getElementById("modCountPill");
  if (modCountPill) modCountPill.textContent = `${state.modifications.length} 项用户修改`;

  document.querySelectorAll("[data-source-path]").forEach((node) => {
    const path = parsePathToken(node.dataset.sourcePath);
    const modified = hasPath(path);
    node.classList.toggle("source-user", modified);
    node.classList.toggle("source-ai", !modified);
    node.textContent = modified ? "用户修改" : "AI提取";
  });
}

function addTag(path, value) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const tags = normalizeStringArray(getAtPath(state.directive, path));
  if (!tags.includes(trimmed)) {
    updateField(path, [...tags, trimmed]);
    render();
  }
}

function removeTag(path, index) {
  const tags = normalizeStringArray(getAtPath(state.directive, path));
  updateField(path, tags.filter((_, itemIndex) => itemIndex !== index));
  render();
}

function addAnchor() {
  const anchors = state.directive["视觉锚点列表"] || [];
  const newAnchor = {
    "对象名称": "",
    "包含描述": "",
    "空间关系": "",
    "文化标签": []
  };
  state.directive = {
    ...state.directive,
    "视觉锚点列表": [...anchors, newAnchor]
  };
  recordModification(["视觉锚点列表", anchors.length, "new"]);
  render();
}

function removeAnchor(index) {
  const anchors = state.directive["视觉锚点列表"] || [];
  state.directive = {
    ...state.directive,
    "视觉锚点列表": anchors.filter((_, itemIndex) => itemIndex !== index)
  };
  recordModification(["视觉锚点列表", index, "deleted"]);
  render();
}

function addSensoryAnchor() {
  const sensory = state.directive["感知锚定"] || {};
  let name = "新感知锚点";
  let count = 1;
  while (Object.prototype.hasOwnProperty.call(sensory, name)) {
    count += 1;
    name = `新感知锚点 ${count}`;
  }
  state.directive = {
    ...state.directive,
    "感知锚定": {
      ...sensory,
      [name]: ""
    }
  };
  recordModification(["感知锚定", name, "new"]);
  render();
}

function removeSensoryAnchor(name) {
  const sensory = { ...(state.directive["感知锚定"] || {}) };
  delete sensory[name];
  state.directive = {
    ...state.directive,
    "感知锚定": sensory
  };
  recordModification(["感知锚定", name, "deleted"]);
  render();
}

function renameSensoryAnchor(oldName, newName) {
  const cleaned = newName.trim();
  if (!cleaned || cleaned === oldName) return;
  const sensory = { ...(state.directive["感知锚定"] || {}) };
  if (Object.prototype.hasOwnProperty.call(sensory, cleaned)) {
    toast("锚点名称已存在", true);
    render();
    return;
  }
  const next = {};
  for (const [key, value] of Object.entries(sensory)) {
    next[key === oldName ? cleaned : key] = value;
  }
  state.directive = {
    ...state.directive,
    "感知锚定": next
  };
  recordModification(["感知锚定", oldName, "renamed_to", cleaned]);
  render();
}

function addRule(type) {
  const rules = state.directive["禁忌与衰减规则"] || { "绝对禁忌": [], "衰减规则": [] };
  const list = rules[type] || [];
  state.directive = {
    ...state.directive,
    "禁忌与衰减规则": {
      ...rules,
      [type]: [...list, ""]
    }
  };
  recordModification(["禁忌与衰减规则", type, list.length, "new"]);
  render();
}

function removeRule(type, index) {
  const rules = state.directive["禁忌与衰减规则"] || { "绝对禁忌": [], "衰减规则": [] };
  const list = rules[type] || [];
  state.directive = {
    ...state.directive,
    "禁忌与衰减规则": {
      ...rules,
      [type]: list.filter((_, itemIndex) => itemIndex !== index)
    }
  };
  recordModification(["禁忌与衰减规则", type, index, "deleted"]);
  render();
}

function moveRule(fromType, toType, index) {
  const rules = state.directive["禁忌与衰减规则"] || { "绝对禁忌": [], "衰减规则": [] };
  const fromList = rules[fromType] || [];
  const toList = rules[toType] || [];
  const item = fromList[index] ?? "";
  state.directive = {
    ...state.directive,
    "禁忌与衰减规则": {
      ...rules,
      [fromType]: fromList.filter((_, itemIndex) => itemIndex !== index),
      [toType]: [...toList, item]
    }
  };
  recordModification(["禁忌与衰减规则", fromType, index, fromType === "衰减规则" ? "promoted_to_taboo" : "demoted_to_decay"]);
  recordModification(["禁忌与衰减规则", toType, toList.length, "new_from_rule_level_change"]);
  render();
}

async function confirmAndTranslate() {
  state.isSubmitting = true;
  state.lastMessage = "提交中";
  render();

  try {
    state.translationResult = await requestAiTranslation(finalPayload());
    state.lastMessage = "AI已生成";
    toast("AI已生成图像提示词");
  } catch (error) {
    state.translationResult = buildLocalTranslation(finalPayload());
    state.lastMessage = "静态模式已生成";
    toast(`AI接口不可用，已使用浏览器本地生成：${error.message}`, true);
  } finally {
    state.isSubmitting = false;
    render();
  }
}

async function requestAiTranslation(payload) {
  const response = await fetch(AI_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directive: payload,
      task: "cpe_translate"
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `HTTP ${response.status}`);
  }

  return normalizeTranslationResponse(data);
}

function normalizeTranslationResponse(data) {
  if (data && typeof data === "object" && (data.forward_prompt || data.negative_prompt || data.generation_params)) {
    return {
      forward_prompt: String(data.forward_prompt || ""),
      negative_prompt: String(data.negative_prompt || ""),
      generation_params: data.generation_params || {}
    };
  }

  if (data && typeof data.answer === "string") {
    const parsed = parseJsonFromText(data.answer);
    if (parsed) return normalizeTranslationResponse(parsed);

    return {
      forward_prompt: data.answer,
      negative_prompt: "",
      generation_params: {
        translator: "cloudflare worker answer"
      }
    };
  }

  throw new Error("AI接口返回格式不符合前端契约");
}

function parseJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildLocalTranslation(payload) {
  const directive = normalizeDirective(payload);
  const anchors = directive["视觉锚点列表"] || [];
  const atmosphere = directive["情感与氛围"] || {};
  const rules = directive["禁忌与衰减规则"] || {};
  const sensory = directive["感知锚定"] || {};
  const modifications = payload["用户修改标记"] || payload.user_modifications || [];

  const anchorLines = anchors
    .map((anchor) => {
      const tags = normalizeStringArray(anchor["文化标签"]);
      return [
        anchor["对象名称"],
        anchor["包含描述"],
        anchor["空间关系"],
        tags.length ? `cultural tags: ${tags.join(", ")}` : ""
      ]
        .filter(Boolean)
        .join("; ");
    })
    .filter(Boolean);

  const sensoryLines = Object.entries(sensory)
    .map(([key, value]) => `${key}: ${stringifyDirectiveItem(value)}`)
    .filter(Boolean);

  const forwardParts = [
    "Cultural image generation prompt:",
    directive["叙事核心"],
    normalizeStringArray(directive["核心记忆锚点"]).length
      ? `Core memory anchors: ${normalizeStringArray(directive["核心记忆锚点"]).join(", ")}`
      : "",
    sensoryLines.length ? `Sensory anchors: ${sensoryLines.join(" | ")}` : "",
    anchorLines.length ? `Visual anchors: ${anchorLines.join(" | ")}` : "",
    normalizeStringArray(atmosphere["情感关键词"]).length
      ? `Emotion and atmosphere: ${normalizeStringArray(atmosphere["情感关键词"]).join(", ")}`
      : "",
    atmosphere["视觉锚定描述"],
    directive["上下文关系"] ? `Context relationship: ${directive["上下文关系"]}` : "",
    directive["空间构图"] ? `Spatial composition: ${directive["空间构图"]}` : "",
    modifications.length ? `Respect user-edited fields exactly; user modification paths: ${JSON.stringify(modifications)}` : ""
  ].filter(Boolean);

  const taboos = normalizeStringArray(rules["绝对禁忌"]);
  const decays = normalizeStringArray(rules["衰减规则"]);
  const negativeParts = [
    taboos.length ? `Absolute taboos: ${taboos.join("; ")}` : "",
    decays.length ? `De-emphasize: ${decays.join("; ")}` : ""
  ].filter(Boolean);

  return {
    forward_prompt: forwardParts.join("\n"),
    negative_prompt: negativeParts.join("\n"),
    generation_params: {
      size: "1024x1024",
      steps: 30,
      guidance_scale: 7,
      seed: "random",
      cultural_fidelity_priority: true,
      translator: "browser static fallback"
    }
  };
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(finalPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cultural_directive.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("JSON已导出");
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label}已复制`);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    toast(`${label}已复制`);
  }
}

function applyImport(rawText) {
  const parsed = JSON.parse(rawText);
  const modifications = Array.isArray(parsed["用户修改标记"])
    ? parsed["用户修改标记"]
    : Array.isArray(parsed.user_modifications)
      ? parsed.user_modifications
      : [];

  state.directive = normalizeDirective(parsed);
  state.modifications = modifications;
  state.translationResult = null;
  state.importOpen = false;
  state.lastMessage = "已导入";
  render();
  toast("JSON已载入");
}

function resetDialogue() {
  const confirmed = window.confirm("清空当前编辑并恢复示例数据？");
  if (!confirmed) return;
  state.directive = normalizeDirective(sampleDirective);
  state.modifications = [];
  state.translationResult = null;
  state.lastMessage = "本地草稿";
  render();
}

function toast(message, isError = false) {
  const container = document.getElementById("toast");
  const node = document.createElement("div");
  node.className = `toast-item${isError ? " error" : ""}`;
  node.textContent = message;
  container.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.action === "update-field") {
    updateField(parsePathToken(target.dataset.path), target.value);
    refreshLivePanels();
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.role === "tag-input" && event.key === "Enter") {
    event.preventDefault();
    addTag(parsePathToken(target.dataset.path), target.value);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "add-anchor") addAnchor();
  if (action === "remove-anchor") removeAnchor(Number(button.dataset.index));
  if (action === "add-sensory") addSensoryAnchor();
  if (action === "remove-sensory") removeSensoryAnchor(button.dataset.key);
  if (action === "add-taboo") addRule("绝对禁忌");
  if (action === "add-decay") addRule("衰减规则");
  if (action === "remove-taboo") removeRule("绝对禁忌", Number(button.dataset.index));
  if (action === "remove-decay") removeRule("衰减规则", Number(button.dataset.index));
  if (action === "promote-decay") moveRule("衰减规则", "绝对禁忌", Number(button.dataset.index));
  if (action === "demote-taboo") moveRule("绝对禁忌", "衰减规则", Number(button.dataset.index));
  if (action === "export-json") exportJSON();
  if (action === "confirm-translate") confirmAndTranslate();
  if (action === "copy-json") copyText(JSON.stringify(finalPayload(), null, 2), "JSON");
  if (action === "copy-result") copyText(JSON.stringify(state.translationResult, null, 2), "生成结果");
  if (action === "reset-dialogue") resetDialogue();
  if (action === "open-import") {
    state.importOpen = true;
    render();
  }
  if (action === "close-import") {
    state.importOpen = false;
    render();
  }
  if (action === "apply-import") {
    const textarea = document.getElementById("importTextarea");
    try {
      applyImport(textarea.value);
    } catch (error) {
      toast(`JSON解析失败：${error.message}`, true);
    }
  }
  if (action === "choose-file") {
    document.getElementById("fileInput").click();
  }
  if (action === "add-tag") {
    const path = parsePathToken(button.dataset.path);
    const input = document.querySelector(`[data-role="tag-input"][data-path="${button.dataset.path}"]`);
    addTag(path, input ? input.value : "");
  }
  if (action === "remove-tag") {
    removeTag(parsePathToken(button.dataset.path), Number(button.dataset.index));
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.dataset.action === "rename-sensory-key") {
    renameSensoryAnchor(target.dataset.key, target.value);
    return;
  }
  if (target && target.id === "fileInput" && target.files && target.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyImport(String(reader.result));
      } catch (error) {
        toast(`文件导入失败：${error.message}`, true);
      }
    };
    reader.readAsText(target.files[0], "utf-8");
    target.value = "";
  }
});

render();
