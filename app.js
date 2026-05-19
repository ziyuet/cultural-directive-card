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
const SOCRATIC_OPENING_QUESTION =
  "你想与我共创以什么为主题的文化活动或者节日海报？";

const state = {
  directive: normalizeDirective(sampleDirective),
  modifications: [],
  isSubmitting: false,
  isSocraticSubmitting: false,
  isTranslatingDirective: false,
  socraticInput: "",
  socraticMessages: [
    {
      role: "assistant",
      content: SOCRATIC_OPENING_QUESTION
    }
  ],
  socraticDirective: null,
  translationResult: null,
  isVisionCritiquing: false,
  stageFourImage: null,
  stageFourImageEvidence: "",
  stageFourCritiqueReport: "",
  stageFourCritiqueHistory: [],
  isTraceGenerating: false,
  traceImage: null,
  traceAnnotations: [],
  traceSummary: "",
  selectedTraceId: "",
  traceJsonInput: "",
  traceRaw: null,
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

function clearStageFourState() {
  state.isVisionCritiquing = false;
  state.stageFourImage = null;
  state.stageFourImageEvidence = "";
  state.stageFourCritiqueReport = "";
  state.stageFourCritiqueHistory = [];
  clearTraceState();
}

function clearTraceState() {
  state.isTraceGenerating = false;
  state.traceImage = null;
  state.traceAnnotations = [];
  state.traceSummary = "";
  state.selectedTraceId = "";
  state.traceJsonInput = "";
  state.traceRaw = null;
}

function toTranslatorDirective(payload) {
  const directive = normalizeDirective(payload);
  const atmosphere = directive["情感与氛围"] || {};
  const modifications = payload["用户修改标记"] || payload.user_modifications || [];

  return {
    "叙事核心句": directive["叙事核心"] || "",
    "核心记忆锚点": directive["核心记忆锚点"] || [],
    "感知锚定": directive["感知锚定"] || {},
    "视觉锚点列表": (directive["视觉锚点列表"] || []).map((anchor) => ({
      "对象": anchor["对象名称"] || "",
      "包含描述": anchor["包含描述"] || "",
      "空间关系": anchor["空间关系"] || "",
      "文化标签": anchor["文化标签"] || []
    })),
    "情感调性": normalizeStringArray(atmosphere["情感关键词"]).join("、"),
    "视觉情感锚定": atmosphere["视觉锚定描述"] || "",
    "禁忌与衰减规则": directive["禁忌与衰减规则"] || { "绝对禁忌": [], "衰减规则": [] },
    "上下文关系": directive["上下文关系"] || "",
    "空间构图": directive["空间构图"] || "",
    "用户修改标记": modifications,
    user_modifications: modifications
  };
}

function buildGenerationPackage() {
  const cpe = toTranslatorDirective(finalPayload());
  const prompts = state.translationResult || buildLocalTranslation(finalPayload());
  return {
    mode: "cpe_to_image_generation",
    provider_targets: ["Stable Diffusion", "DALL-E 3", "Flux"],
    cpe_quadrants: {
      visual_anchors: cpe["视觉锚点列表"],
      taboo_rules: cpe["禁忌与衰减规则"],
      atmosphere_calibration: {
        emotion_tone: cpe["情感调性"],
        visual_emotion_anchor: cpe["视觉情感锚定"],
        recommended_lora: prompts.generation_params?.recommended_lora || prompts.generation_params?.style || ""
      },
      narrative_core: cpe["叙事核心句"]
    },
    prompts,
    control_policy: {
      user_prompt_hidden: true,
      assemble_from_cpe_only: true,
      user_modifications_must_be_preserved: cpe["用户修改标记"] || []
    }
  };
}

function buildImageGenerationChatPrompt() {
  const generationPackage = buildGenerationPackage();
  return [
    "请根据下面的“图像生成交接包”生成一张图像。",
    "",
    "执行规则：",
    "1. 直接生成图片，不要把它改写成新的主题，也不要添加用户没有提供的文化元素。",
    "2. 必须保留 forward_prompt 中的视觉锚点、空间关系、光线、视角和构图。",
    "3. 必须避开 negative_prompt 中的所有禁忌；如果当前平台不支持 negative prompt，也要在生成时主动排除这些元素。",
    "4. 生成后，请附上一段“生成图像证据”，用中文列出实际画面中出现的主要物件、人物动作、光线色彩、空间布局，以及是否出现任何可能触犯禁忌的元素。我会把这段证据粘贴回网页继续做文化批判。",
    "",
    "图像生成交接包：",
    JSON.stringify(generationPackage, null, 2)
  ].join("\n");
}

function buildUploadedImageEvidence(image) {
  if (!image) return "";
  return [
    "已上传外部生成图像，可用于 Gemma 看图批判。",
    "",
    "图像文件信息：",
    `- 文件名：${image.name || "未命名"}`,
    `- 类型：${image.type || "未知"}`,
    `- 大小：${image.size ? `${Math.round(image.size / 1024)} KB` : "未知"}`,
    "",
    "人工观察补充：",
    "（请在这里补充你看到的主要物件、人物动作、光线色彩、空间布局，以及是否出现禁忌元素。）"
  ].join("\n");
}

function buildAdversarialDecodeChatPrompt() {
  const evidence = state.stageFourImageEvidence.trim() || "（尚未提供生成图像证据。若缺少证据，请先要求用户补充图像描述，不要凭空判断图像内容。）";
  return [
    "你是一个文化人类学批评者，任务是基于原始 CPE、图像生成交接包和生成图像证据，对生成结果进行对抗性文化解码。如果我同时上传了一张生成图像，请优先直接观察图像；如果没有图像，只能根据文字证据判断。",
    "",
    "审查原则：",
    "1. 只根据 CPE 与生成图像证据判断，不要臆造图像里没有被描述的内容。",
    "2. 刻板印象扫描：检查是否出现与主题不匹配、过度符号化或陈词滥调的文化符号。",
    "3. 叙事一致性检查：检查图像是否偏离用户的核心叙事、关系、私密/公共氛围、空间构图。",
    "4. 禁忌触犯检查：逐条核对绝对禁忌与衰减规则，判断是否出现、是否过强、是否需要移除或弱化。",
    "5. 用户是意义的最终仲裁者，所以批评必须具体、可执行，避免替用户重新定义主题。",
    "",
    "请只输出下面结构的 JSON，不要添加解释文字：",
    JSON.stringify({
      "刻板印象扫描": "是否出现陈词滥调或错误文化符号，给出依据",
      "叙事一致性检查": "图像是否忠实于核心叙事和关系氛围",
      "禁忌触犯检查": "逐条说明绝对禁忌或衰减规则是否被触犯",
      "具体批评": ["2-3条具体问题"],
      "修正建议": ["2-3条可执行修正建议"],
      "建议用户操作": "接受批评并重新生成 / 忽视批评保留当前版本 / 部分接受并修改CPE",
      "再生成提示词修正": {
        "forward_prompt_additions": "需要加强的正向描述",
        "negative_prompt_additions": "需要补充或加重的负向约束"
      }
    }, null, 2),
    "",
    "原始 CPE：",
    JSON.stringify(toTranslatorDirective(finalPayload()), null, 2),
    "",
    "图像生成交接包：",
    JSON.stringify(buildGenerationPackage(), null, 2),
    "",
    "生成图像证据：",
    evidence
  ].join("\n");
}

function buildRegenerationChatPrompt() {
  const report = state.stageFourCritiqueReport.trim();
  return [
    "请依据下面的文化批判报告重新生成图片。",
    "",
    "执行规则：",
    "1. 原始 CPE 仍然是最高优先级，不要改变用户的文化主题、叙事核心、视觉锚点和禁忌规则。",
    "2. 只接受文化批判报告中与 CPE 一致的修正建议。",
    "3. 重新生成时加强报告指出的缺失视觉锚点，移除或弱化报告指出的禁忌/刻板元素。",
    "4. 生成后仍然附上“生成图像证据”，方便继续审查。",
    "",
    "原始图像生成指令：",
    buildImageGenerationChatPrompt(),
    "",
    "文化批判报告：",
    report || "（尚未粘贴文化批判报告。）"
  ].join("\n");
}

function buildTraceContext() {
  return {
    stage1_socratic_dialogue: state.socraticMessages,
    stage1_structured_cpe: state.socraticDirective,
    stage2_translation_result: state.translationResult,
    stage3_current_cpe: toTranslatorDirective(finalPayload()),
    stage3_user_modifications: state.modifications,
    stage4_generation_package: buildGenerationPackage(),
    stage4_image_evidence: state.stageFourImageEvidence,
    stage4_current_critique_report: state.stageFourCritiqueReport,
    stage4_critique_history: state.stageFourCritiqueHistory
  };
}

function buildCritiqueArchiveText() {
  const records = [...state.stageFourCritiqueHistory];
  const current = state.stageFourCritiqueReport.trim();
  if (current && !records.some((item) => item.report === current)) {
    records.push({
      round: records.length + 1,
      source: "current_textarea",
      saved_at: new Date().toISOString(),
      report: current
    });
  }

  if (!records.length) return "";
  return records
    .map((item) => [
      `第${item.round || "?"}轮批判（${item.source || "unknown"}，${item.saved_at || "no timestamp"}）：`,
      item.report || ""
    ].join("\n"))
    .join("\n\n");
}

function saveStageFourCritiqueRecord(source = "manual") {
  const report = state.stageFourCritiqueReport.trim();
  if (!report) return;
  if (state.stageFourCritiqueHistory.some((item) => item.report === report)) return;
  state.stageFourCritiqueHistory = [
    ...state.stageFourCritiqueHistory,
    {
      round: state.stageFourCritiqueHistory.length + 1,
      source,
      saved_at: new Date().toISOString(),
      report
    }
  ];
}

function buildCulturalTraceChatPrompt() {
  return [
    "请完成“文化溯源与话语权可视化”任务。我会同时上传最终图片；如果没有图片，请先要求我上传，不要凭空标注。",
    "",
    "目标：让用户看见最终画面里哪些关键元素来自用户表达，哪些来自用户修改，哪些是AI为画面完整性自动补全。",
    "",
    "标注类型：",
    "1. user_anchor：来自用户 CPE、阶段一对话、核心记忆锚点、感知锚定、视觉锚点或空间构图的元素。",
    "2. user_modified_anchor：来自阶段三用户修改标记，或阶段四批判/修正回路后被用户采纳、强化、保留的元素。",
    "3. model_completion：最终图片中可见，但前面阶段没有明确要求，只是模型自动补全的背景、器物、装饰、人物、光影或场景填充。",
    "",
    "输出严格 JSON，不要 Markdown。bbox 使用百分比坐标，x/y 为左上角，范围 0-100。",
    JSON.stringify({
      summary: "一句话说明最终图片中用户表达、用户改动与AI补全的关系",
      annotations: [
        {
          id: "a1",
          type: "user_anchor | user_modified_anchor | model_completion",
          label: "图中元素短名称",
          bbox: { x: 10, y: 20, width: 30, height: 25 },
          source_path: "来源字段路径或 AI completion",
          source_quote: "用户原话、CPE片段或空字符串",
          trace_text: "点击标注时显示的文化溯源码",
          reasoning: "判定依据",
          confidence: "low | medium | high"
        }
      ]
    }, null, 2),
    "",
    "完整阶段上下文：",
    JSON.stringify(buildTraceContext(), null, 2),
    "",
    "注意：如果最终图片不是阶段四最初上传的图片，请以我当前上传给你的最终图片为准。"
  ].join("\n");
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="app-header">
      <div class="header-inner">
        <div class="title-block">
          <h1>文化图像工作流</h1>
          <div class="meta-line">
            <span class="status-pill ready">一站式交互</span>
            <span class="status-pill">阶段一：苏格拉底启发</span>
            <span class="status-pill">阶段二：文化翻译</span>
            <span class="status-pill">阶段三：用户确认</span>
            <span class="status-pill">阶段四：对抗解码</span>
            <span class="status-pill">阶段五：文化溯源</span>
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
      ${renderWorkflow()}
    </main>
    ${state.importOpen ? renderImportModal() : ""}
    <input class="hidden-input" id="fileInput" type="file" accept="application/json,.json" />
  `;
}

function renderWorkflow() {
  return `
    <section class="workflow">
      ${renderSocraticPanel()}
      ${renderTranslationPanel()}
      ${renderStageThreePanel()}
      ${renderStageFourPanel()}
      ${renderTracePanel()}
    </section>
  `;
}

function renderSocraticPanel() {
  return `
    <section class="workflow-panel">
      <div class="section-head">
        <div>
          <h2>阶段一：苏格拉底启发</h2>
          <div class="section-count">${state.socraticDirective ? "已生成结构化文化叙事 JSON" : "按固定阶段回答 AI 追问"}</div>
        </div>
        <button class="secondary-btn" data-action="reset-socratic">${buttonIcon("reset")}重开启发</button>
      </div>
      <div class="chat-log">
        ${state.socraticMessages.map(renderChatMessage).join("")}
      </div>
      <div class="chat-input-row">
        <textarea id="socraticInput" class="chat-input" rows="3" placeholder="在这里回答当前问题">${escapeHtml(state.socraticInput)}</textarea>
        <button class="primary-btn" data-action="send-socratic" ${state.isSocraticSubmitting ? "disabled" : ""}>${buttonIcon("send")}${state.isSocraticSubmitting ? "发送中" : "发送"}</button>
      </div>
      ${
        state.socraticDirective
          ? `<div class="workflow-note">阶段一最终 JSON 已载入下方确认卡，可继续阶段二翻译或手动调整。</div>`
          : ""
      }
    </section>
  `;
}

function renderChatMessage(message) {
  return `
    <div class="chat-message ${message.role === "user" ? "chat-user" : "chat-assistant"}">
      <div class="chat-role">${message.role === "user" ? "你" : "AI"}</div>
      <div class="chat-content">${escapeHtml(message.content)}</div>
    </div>
  `;
}

function renderTranslationPanel() {
  const canTranslate = Boolean(state.socraticDirective);
  return `
    <section class="workflow-panel">
      <div class="section-head">
        <div>
          <h2>阶段二：文化翻译</h2>
          <div class="section-count">${state.translationResult ? "已生成图像提示词" : "将阶段一 JSON 翻译为绘图 prompt"}</div>
        </div>
        <button class="primary-btn" data-action="run-stage-two" ${!canTranslate || state.isTranslatingDirective ? "disabled" : ""}>${buttonIcon("send")}${state.isTranslatingDirective ? "翻译中" : "运行文化翻译"}</button>
      </div>
      ${
        canTranslate
          ? `<pre class="json-preview workflow-json">${escapeHtml(JSON.stringify(state.socraticDirective, null, 2))}</pre>`
          : `<div class="empty-state">完成阶段一后，这里会出现结构化文化叙事 JSON。</div>`
      }
    </section>
  `;
}

function renderStageThreePanel() {
  return `
    <section class="workflow-panel">
      <div class="section-head">
        <div>
          <h2>阶段三：用户确认</h2>
          <div class="section-count">审核 CPE 块，保留用户修改标记，用户是意义的最终仲裁者</div>
        </div>
        <div class="toolbar">
          <button class="secondary-btn" data-action="export-json">${buttonIcon("download")}导出JSON</button>
          <button class="primary-btn" data-action="confirm-translate" ${state.isSubmitting ? "disabled" : ""}>${buttonIcon("send")}${state.isSubmitting ? "生成中" : "确认并生成"}</button>
        </div>
      </div>
      <div class="stage-three-layout">
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
    </section>
  `;
}

function renderStageFourPanel() {
  const hasPrompt = Boolean(state.translationResult?.forward_prompt);
  const hasEvidence = Boolean(state.stageFourImageEvidence.trim());
  const hasReport = Boolean(state.stageFourCritiqueReport.trim());
  const hasUploadedImage = Boolean(state.stageFourImage?.image_data_url);
  return `
    <section class="workflow-panel">
      <div class="section-head">
        <div>
          <h2>阶段四：多模态生成与对抗解码代理</h2>
          <div class="section-count">${hasReport ? "已粘贴文化批判报告" : "CPE → 图像生成交接包 → 生成图像证据 → 对抗解码"}</div>
        </div>
        <button class="primary-btn" data-action="copy-image-prompt" ${!hasPrompt ? "disabled" : ""}>${buttonIcon("copy")}复制生图指令</button>
      </div>
      ${hasPrompt ? `
        <div class="stage-four-flow">
          ${renderStageFourStep(
            1,
            "当前文化指令 CPE",
            "这是文化意义、视觉锚点、禁忌规则和构图的原始依据。",
            `
              <pre class="json-preview workflow-json">${escapeHtml(JSON.stringify(toTranslatorDirective(finalPayload()), null, 2))}</pre>
            `,
            `<button class="secondary-btn" data-action="copy-cpe">${buttonIcon("copy")}复制CPE</button>`
          )}
          ${renderStageFourStep(
            2,
            "图像生成交接包",
            "由 CPE 和阶段二翻译结果自动组装，用来交给图像生成模型。",
            renderGenerationPackagePreview(),
            `<button class="secondary-btn" data-action="copy-generation-package">${buttonIcon("copy")}复制交接包</button>`
          )}
          ${renderStageFourStep(
            3,
            "生成图像证据",
            "复制生图指令到 ChatGPT 或其他文生图工具生成图片，再把图片上传回来供 Gemma 批判。",
            `
              <div class="field">
                <span class="field-label">复制给 GPT 的图像生成指令</span>
                <textarea class="chat-input prompt-textarea" rows="12" readonly>${escapeHtml(buildImageGenerationChatPrompt())}</textarea>
              </div>
              <div class="action-row">
                <button class="primary-btn" data-action="copy-image-prompt">${buttonIcon("copy")}一键复制生图指令</button>
              </div>
              <div class="field">
                <span class="field-label">上传外部生成图像</span>
                <input id="stageFourImageFile" class="file-input" type="file" accept="image/png,image/jpeg,image/webp">
              </div>
              ${renderStageFourImagePreview()}
              <div class="field">
                <span class="field-label">生成图像证据</span>
                <textarea id="stageFourImageEvidence" class="chat-input" rows="7" placeholder="把 GPT 或其他工具生成图片后给出的画面说明、图片链接，或你自己观察到的画面内容粘贴在这里。若已上传图片，Gemma 会直接看图；这里可补充你观察到的物件、人物动作、光线色彩、空间布局和禁忌元素。">${escapeHtml(state.stageFourImageEvidence)}</textarea>
              </div>
            `
          )}
          ${renderStageFourStep(
            4,
            "运行对抗解码",
            hasUploadedImage ? "可直接用 Gemma 读取上传图像并输出文化批判；也可复制指令到 GPT 网页端作为备用。" : hasEvidence ? "复制下面的批判指令到 GPT，让它依据 CPE 和图像证据进行文化审查。" : "先上传生成图片或填写生成图像证据，再运行对抗解码。",
            `
              <div class="field">
                <span class="field-label">复制给 GPT 的对抗解码指令</span>
                <textarea id="stageFourDecodePrompt" class="chat-input prompt-textarea" rows="14" readonly>${escapeHtml(buildAdversarialDecodeChatPrompt())}</textarea>
              </div>
              <div class="action-row">
                <button class="primary-btn" data-action="critique-uploaded-image" ${!hasUploadedImage || state.isVisionCritiquing ? "disabled" : ""}>${buttonIcon("send")}${state.isVisionCritiquing ? "Gemma批判中" : "使用Gemma看图并批判"}</button>
                <button class="secondary-btn" data-action="run-stage-four" data-stage-four-decode-copy ${!hasEvidence ? "disabled" : ""}>${buttonIcon("copy")}一键复制对抗解码指令</button>
              </div>
              <div class="field">
                <span class="field-label">文化批判报告</span>
                <textarea id="stageFourCritiqueReport" class="chat-input" rows="8" placeholder="Gemma 看图批判的结果会自动写入这里；你也可以把 GPT 的文化批判报告手动粘贴在这里。粘贴后可以选择接受批评并复制重新生成指令、忽视批评，或回到阶段三手动修改 CPE。">${escapeHtml(state.stageFourCritiqueReport)}</textarea>
              </div>
              <div class="action-row">
                <button class="secondary-btn" data-action="save-stage-four-critique" data-stage-four-report-action ${!hasReport ? "disabled" : ""}>保存本轮批判</button>
                <button class="secondary-btn" data-action="accept-stage-four" data-stage-four-report-action ${!hasReport ? "disabled" : ""}>接受批评并重新生成</button>
                <button class="secondary-btn" data-action="ignore-stage-four" data-stage-four-report-action ${!hasReport ? "disabled" : ""}>忽视批评，保留当前版本</button>
                <button class="ghost-btn" data-action="partial-stage-four" data-stage-four-report-action ${!hasReport ? "disabled" : ""}>部分接受，手动修改CPE</button>
              </div>
            `
          )}
        </div>
      ` : '<div class="empty-state">完成阶段二或阶段三生成后，这里会出现图像生成交接包和可复制的 GPT 指令。</div>'}
    </section>
  `;
}

function renderStageFourStep(number, title, note, body, actions = "") {
  return `
    <article class="stage-four-step">
      <div class="stage-four-number">${number}</div>
      <div class="stage-four-body">
        <div class="stage-four-head">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(note)}</p>
          </div>
          ${actions ? `<div class="stage-four-actions">${actions}</div>` : ""}
        </div>
        ${body}
      </div>
    </article>
  `;
}

function renderGenerationPackagePreview() {
  return `
    <div class="result-block no-margin">
      <div class="result-label">图像生成交接包</div>
      <pre class="json-preview workflow-json">${escapeHtml(JSON.stringify(buildGenerationPackage(), null, 2))}</pre>
    </div>
  `;
}

function renderStageFourImagePreview() {
  if (!state.stageFourImage?.image_data_url) {
    return "";
  }

  return `
    <div class="generated-image-panel">
      <div class="result-label">已上传的生成图像</div>
      <img class="generated-image" src="${escapeAttr(state.stageFourImage.image_data_url)}" alt="Uploaded generated image">
      <div class="generated-image-meta">
        ${escapeHtml(state.stageFourImage.name || "未命名")} ·
        ${escapeHtml(state.stageFourImage.type || "未知类型")} ·
        ${escapeHtml(state.stageFourImage.size ? `${Math.round(state.stageFourImage.size / 1024)} KB` : "未知大小")}
      </div>
    </div>
  `;
}

function renderTracePanel() {
  const traceImage = getTraceImage();
  const hasImage = Boolean(traceImage?.image_data_url);
  const hasAnnotations = state.traceAnnotations.length > 0;
  const userCount = state.traceAnnotations.filter((item) => item.type === "user_anchor").length;
  const modifiedCount = state.traceAnnotations.filter((item) => item.type === "user_modified_anchor").length;
  const modelCount = state.traceAnnotations.filter((item) => item.type === "model_completion").length;

  return `
    <section class="workflow-panel">
      <div class="section-head">
        <div>
          <h2>阶段五：文化溯源与话语权可视化</h2>
          <div class="section-count">${hasAnnotations ? `${userCount} 个用户锚定，${modifiedCount} 个用户改动，${modelCount} 个模型补全` : "默认使用阶段四图片，也可上传最终图片覆盖默认图"}</div>
        </div>
        <div class="toolbar">
          <button class="secondary-btn" data-action="copy-trace-prompt">${buttonIcon("copy")}复制溯源提示词</button>
          <button class="primary-btn" data-action="generate-trace" ${!hasImage || state.isTraceGenerating ? "disabled" : ""}>${buttonIcon("send")}${state.isTraceGenerating ? "溯源中" : "生成文化溯源标注"}</button>
        </div>
      </div>
      <div class="field">
        <span class="field-label">上传最终图片（可选）</span>
        <input id="stageFiveImageFile" class="file-input" type="file" accept="image/png,image/jpeg,image/webp">
      </div>
      <div class="field">
        <span class="field-label">复制到 GPT 的文化溯源提示词</span>
        <textarea class="chat-input prompt-textarea" rows="10" readonly>${escapeHtml(buildCulturalTraceChatPrompt())}</textarea>
      </div>
      <div class="field">
        <span class="field-label">粘贴外部 GPT 返回的溯源 JSON</span>
        <textarea id="traceJsonInput" class="chat-input prompt-textarea" rows="9" placeholder="把外部 GPT 生成的 JSON 粘贴到这里。系统会解析 annotations / trace_annotations，并自动在最终图片上绘制标注。">${escapeHtml(state.traceJsonInput)}</textarea>
      </div>
      <div class="action-row">
        <button class="secondary-btn" data-action="apply-trace-json" ${!state.traceJsonInput.trim() ? "disabled" : ""}>应用外部JSON标注</button>
      </div>
      ${
        hasImage
          ? `
            <div class="trace-layout">
              <div class="trace-viewer">
                <div class="trace-legend">
                  <span><i class="trace-swatch user-anchor"></i>用户锚定元素</span>
                  <span><i class="trace-swatch user-modified-anchor"></i>用户改动锚定</span>
                  <span><i class="trace-swatch model-completion"></i>模型补全元素</span>
                </div>
                <div class="trace-canvas">
                  <img class="trace-image" src="${escapeAttr(traceImage.image_data_url)}" alt="Final image for cultural trace">
                  ${renderTraceBoxes()}
                </div>
              </div>
              <div class="trace-side">
                ${renderTraceDetail()}
              </div>
            </div>
            ${state.traceSummary ? `<div class="workflow-note">${escapeHtml(state.traceSummary)}</div>` : ""}
          `
          : `<div class="empty-state">阶段五默认使用阶段四上传的图片。若阶段四还没有图片，请先上传最终图片。</div>`
      }
    </section>
  `;
}

function getTraceImage() {
  return state.traceImage?.image_data_url ? state.traceImage : state.stageFourImage;
}

function renderTraceBoxes() {
  if (!state.traceAnnotations.length) {
    return '<div class="trace-empty-overlay">尚未生成溯源标注</div>';
  }

  return state.traceAnnotations
    .map((item) => {
      const box = normalizeTraceBox(item.bbox);
      const selected = String(item.id) === String(state.selectedTraceId);
      const className = `trace-box ${traceTypeClass(item.type)}${selected ? " selected" : ""}`;
      return `
        <button
          class="${className}"
          data-action="select-trace"
          data-id="${escapeAttr(item.id)}"
          style="left:${box.x}%;top:${box.y}%;width:${box.width}%;height:${box.height}%"
          title="${escapeAttr(item.label || "")}"
        >
          <span>${escapeHtml(item.label || "标注")}</span>
        </button>
      `;
    })
    .join("");
}

function renderTraceDetail() {
  if (!state.traceAnnotations.length) {
    return `
      <div class="trace-detail empty">
        <h3>文化溯源码</h3>
        <p>生成标注后，点击图像中的框查看元素来源。</p>
      </div>
    `;
  }

  const selected = state.traceAnnotations.find((item) => String(item.id) === String(state.selectedTraceId)) || state.traceAnnotations[0];
  const typeText = traceTypeText(selected.type);
  const source = selected.source_quote || selected.source_path || selected.reasoning || "";

  return `
    <div class="trace-detail">
      <div class="trace-type ${traceTypeClass(selected.type)}">${typeText}</div>
      <h3>${escapeHtml(selected.label || "未命名元素")}</h3>
      <p>${escapeHtml(selected.trace_text || selected.reasoning || "暂无溯源说明。")}</p>
      ${source ? `<div class="trace-source"><span>来源</span>${escapeHtml(source)}</div>` : ""}
      ${selected.confidence ? `<div class="trace-confidence">识别置信度：${escapeHtml(selected.confidence)}</div>` : ""}
    </div>
  `;
}

function traceTypeClass(type) {
  if (type === "model_completion") return "model-completion";
  if (type === "user_modified_anchor") return "user-modified-anchor";
  return "user-anchor";
}

function traceTypeText(type) {
  if (type === "model_completion") return "模型补全元素";
  if (type === "user_modified_anchor") return "用户改动锚定";
  return "用户锚定元素";
}

function normalizeTraceBox(bbox) {
  const source = bbox && typeof bbox === "object" ? bbox : {};
  const x = clampPercent(source.x ?? source.left ?? 8, 0, 98);
  const y = clampPercent(source.y ?? source.top ?? 8, 0, 98);
  const width = clampPercent(source.width ?? source.w ?? 24, 2, 100 - x);
  const height = clampPercent(source.height ?? source.h ?? 18, 2, 100 - y);
  return { x, y, width, height };
}

function clampPercent(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
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
    clearStageFourState();
    state.lastMessage = "AI已生成";
    toast("AI已生成图像提示词");
  } catch (error) {
    state.translationResult = buildLocalTranslation(finalPayload());
    clearStageFourState();
    state.lastMessage = "静态模式已生成";
    toast(`AI接口不可用，已使用浏览器本地生成：${error.message}`, true);
  } finally {
    state.isSubmitting = false;
    render();
  }
}

async function sendSocraticMessage() {
  const input = document.getElementById("socraticInput");
  const content = String(input ? input.value : state.socraticInput).trim();
  if (!content || state.isSocraticSubmitting) return;

  state.socraticInput = "";
  state.isSocraticSubmitting = true;
  state.socraticMessages = [...state.socraticMessages, { role: "user", content }];
  state.lastMessage = "阶段一对话中";
  render();

  try {
    const answer = await requestSocraticAnswer(state.socraticMessages);
    state.socraticMessages = [...state.socraticMessages, { role: "assistant", content: answer }];
    const finalDirective = extractFinalDirective(answer);

    if (finalDirective) {
      state.socraticDirective = finalDirective;
      state.directive = normalizeDirective(finalDirective);
      state.modifications = [];
      state.translationResult = null;
      clearStageFourState();
      state.lastMessage = "阶段一完成";
      toast("阶段一最终 JSON 已载入确认卡");
    } else {
      state.lastMessage = "等待下一轮回答";
    }
  } catch (error) {
    state.lastMessage = "阶段一接口不可用";
    toast(`苏格拉底启发请求失败：${error.message}`, true);
  } finally {
    state.isSocraticSubmitting = false;
    render();
  }
}

async function requestSocraticAnswer(messages) {
  const response = await fetch(AI_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: "socratic",
      messages
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `HTTP ${response.status}`);
  }

  if (!data.answer) {
    throw new Error("AI接口未返回追问内容");
  }
  return String(data.answer);
}

async function runStageTwoTranslation() {
  if (!state.socraticDirective || state.isTranslatingDirective) return;

  state.isTranslatingDirective = true;
  state.lastMessage = "阶段二翻译中";
  render();

  try {
    state.translationResult = await requestAiTranslation({
      ...state.socraticDirective,
      "用户修改标记": state.modifications,
      user_modifications: state.modifications
    });
    clearStageFourState();
    state.lastMessage = "阶段二完成";
    toast("阶段二文化翻译已完成");
  } catch (error) {
    state.translationResult = buildLocalTranslation(finalPayload());
    clearStageFourState();
    state.lastMessage = "阶段二静态回退";
    toast(`文化翻译接口不可用，已使用本地生成：${error.message}`, true);
  } finally {
    state.isTranslatingDirective = false;
    render();
  }
}

function loadStageFourImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("请上传图片文件", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.stageFourImage = {
      name: file.name,
      type: file.type,
      size: file.size,
      image_data_url: String(reader.result || "")
    };
    clearTraceState();
    if (!state.stageFourImageEvidence.trim()) {
      state.stageFourImageEvidence = buildUploadedImageEvidence(state.stageFourImage);
    }
    state.lastMessage = "已上传生成图像";
    render();
    toast("生成图像已上传，可运行Gemma批判");
  };
  reader.onerror = () => {
    toast("图片读取失败", true);
  };
  reader.readAsDataURL(file);
}

function loadTraceImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("请上传图片文件", true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    clearTraceState();
    state.traceImage = {
      name: file.name,
      type: file.type,
      size: file.size,
      image_data_url: String(reader.result || "")
    };
    state.lastMessage = "已上传最终图片";
    render();
    toast("最终图片已上传，可生成文化溯源标注");
  };
  reader.onerror = () => {
    toast("最终图片读取失败", true);
  };
  reader.readAsDataURL(file);
}

async function critiqueUploadedImage() {
  if (!state.stageFourImage?.image_data_url || state.isVisionCritiquing) {
    toast("请先上传外部生成图像", true);
    return;
  }

  state.isVisionCritiquing = true;
  state.lastMessage = "Gemma看图批判中";
  render();

  try {
    const critique = await requestGemmaVisionCritique({
      cpe: toTranslatorDirective(finalPayload()),
      generation_package: buildGenerationPackage(),
      image_data_url: state.stageFourImage.image_data_url,
      image_evidence: state.stageFourImageEvidence || ""
    });
    state.stageFourCritiqueReport = JSON.stringify(critique.report || critique, null, 2);
    saveStageFourCritiqueRecord("gemma_vision");
    state.lastMessage = "Gemma批判完成";
    toast("Gemma已完成看图文化批判");
  } catch (error) {
    state.lastMessage = "Gemma批判失败";
    toast(`Gemma看图批判失败：${error.message}`, true);
  } finally {
    state.isVisionCritiquing = false;
    render();
  }
}

async function requestGemmaVisionCritique(payload) {
  const response = await fetch(AI_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: "critique_image",
      ...payload
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `HTTP ${response.status}`);
  }
  return data;
}

async function generateCulturalTrace() {
  const traceImage = getTraceImage();
  if (!traceImage?.image_data_url || state.isTraceGenerating) {
    toast("请先在阶段四或阶段五上传最终图片", true);
    return;
  }

  saveStageFourCritiqueRecord("before_trace");
  state.isTraceGenerating = true;
  state.lastMessage = "文化溯源生成中";
  render();

  try {
    const trace = await requestCulturalTrace({
      cpe: toTranslatorDirective(finalPayload()),
      generation_package: buildGenerationPackage(),
      image_data_url: traceImage.image_data_url,
      image_evidence: state.stageFourImageEvidence || "",
      critique_report: buildCritiqueArchiveText(),
      dialogue_evidence: buildDialogueEvidence(),
      user_modifications: state.modifications,
      stage_context: buildTraceContext()
    });
    applyTraceResult(trace);
    state.lastMessage = "文化溯源完成";
    toast("文化溯源标注已生成");
  } catch (error) {
    state.lastMessage = "文化溯源失败";
    toast(`文化溯源失败：${error.message}`, true);
  } finally {
    state.isTraceGenerating = false;
    render();
  }
}

async function requestCulturalTrace(payload) {
  const response = await fetch(AI_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: "trace_image",
      ...payload
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || `HTTP ${response.status}`);
  }
  return data.trace || data;
}

function applyTraceResult(trace) {
  const normalized = normalizeTraceResult(trace);
  if (!normalized.annotations.length) {
    throw new Error("溯源JSON中没有可用的 annotations");
  }
  state.traceAnnotations = normalized.annotations;
  state.traceSummary = normalized.summary;
  state.traceRaw = trace;
  state.selectedTraceId = normalized.annotations[0]?.id || "";
}

function applyTraceJsonInput() {
  const raw = state.traceJsonInput.trim();
  if (!raw) {
    toast("请先粘贴溯源JSON", true);
    return;
  }

  const parsed = parseJsonFromText(raw);
  if (!parsed) {
    toast("无法解析JSON，请检查格式", true);
    return;
  }

  try {
    applyTraceResult(parsed.trace || parsed);
    state.lastMessage = "已应用外部溯源JSON";
    toast("外部JSON标注已应用到最终图片");
    render();
  } catch (error) {
    toast(`外部JSON无法应用：${error.message}`, true);
  }
}

function normalizeTraceResult(trace) {
  const source = trace && typeof trace === "object" ? trace : {};
  const annotations = Array.isArray(source.annotations)
    ? source.annotations
    : Array.isArray(source.trace_annotations)
      ? source.trace_annotations
      : [];

  return {
    summary: String(source.summary || source.recognition_summary || ""),
    annotations: annotations
      .map((item, index) => normalizeTraceAnnotation(item, index))
      .filter((item) => item.label && item.bbox)
      .slice(0, 12)
  };
}

function normalizeTraceAnnotation(item, index) {
  const source = item && typeof item === "object" ? item : {};
  const id = String(source.id || `trace-${index + 1}`);
  const rawType = source.type || source.category || "";
  const type = rawType === "model_completion"
    ? "model_completion"
    : rawType === "user_modified_anchor"
      ? "user_modified_anchor"
      : "user_anchor";
  return {
    id,
    type,
    label: String(source.label || source.element || source.name || ""),
    bbox: normalizeTraceBox(source.bbox || source.box || {}),
    source_path: String(source.source_path || ""),
    source_quote: String(source.source_quote || source.quote || ""),
    trace_text: String(source.trace_text || source.trace || source.explanation || ""),
    reasoning: String(source.reasoning || ""),
    confidence: String(source.confidence || "")
  };
}

function buildDialogueEvidence() {
  return state.socraticMessages
    .filter((message) => message.role === "user")
    .map((message, index) => `用户回答${index + 1}：${message.content}`)
    .join("\n\n");
}

async function runStageFourDecode() {
  if (!state.translationResult?.forward_prompt) return;
  if (!state.stageFourImageEvidence.trim()) {
    toast("请先粘贴生成图像证据", true);
    return;
  }
  await copyText(buildAdversarialDecodeChatPrompt(), "对抗解码指令");
  state.lastMessage = "对抗解码指令已复制";
  render();
}

function acceptStageFourCritique() {
  if (!state.stageFourCritiqueReport.trim()) {
    toast("请先粘贴文化批判报告", true);
    return;
  }
  saveStageFourCritiqueRecord("accept_and_regenerate");
  copyText(buildRegenerationChatPrompt(), "重新生成指令");
  state.lastMessage = "重新生成指令已复制";
  render();
}

function ignoreStageFourCritique() {
  if (!state.stageFourCritiqueReport.trim()) {
    toast("请先粘贴文化批判报告", true);
    return;
  }
  saveStageFourCritiqueRecord("ignore_and_keep");
  state.lastMessage = "已保留当前版本";
  toast("已保留当前版本，不修改CPE和提示词");
  render();
}

function partialAcceptStageFourCritique() {
  if (!state.stageFourCritiqueReport.trim()) {
    toast("请先粘贴文化批判报告", true);
    return;
  }
  saveStageFourCritiqueRecord("partial_accept_edit_cpe");
  state.lastMessage = "请手动修改CPE块";
  toast("请在阶段三中修改对应象限后重新运行阶段二/四");
  document.querySelector(".stage-three-layout")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveCurrentStageFourCritique() {
  if (!state.stageFourCritiqueReport.trim()) {
    toast("请先粘贴文化批判报告", true);
    return;
  }
  const before = state.stageFourCritiqueHistory.length;
  saveStageFourCritiqueRecord("manual_saved");
  state.lastMessage = "已保存阶段四批判";
  toast(state.stageFourCritiqueHistory.length > before ? "本轮批判已保存" : "这轮批判已在历史中");
  render();
}

function extractFinalDirective(text) {
  if (!text.includes("最终输出") && !text.includes("叙事核心句")) {
    return null;
  }
  const parsed = parseJsonFromText(text);
  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed["叙事核心句"] && !parsed["叙事核心"]) return null;
  return parsed;
}

function resetSocraticFlow() {
  const confirmed = window.confirm("重启阶段一对话？当前苏格拉底聊天记录会被清空。");
  if (!confirmed) return;
  state.socraticInput = "";
  state.socraticMessages = [{ role: "assistant", content: SOCRATIC_OPENING_QUESTION }];
  state.socraticDirective = null;
  state.translationResult = null;
  clearStageFourState();
  state.lastMessage = "阶段一已重启";
  render();
}

async function requestAiTranslation(payload) {
  const response = await fetch(AI_TRANSLATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      directive: toTranslatorDirective(payload),
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
  state.socraticDirective = toTranslatorDirective(parsed);
  state.modifications = modifications;
  state.translationResult = null;
  clearStageFourState();
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
  state.socraticDirective = null;
  state.translationResult = null;
  clearStageFourState();
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
  if (target.id === "socraticInput") {
    state.socraticInput = target.value;
    return;
  }
  if (target.id === "stageFourImageEvidence") {
    state.stageFourImageEvidence = target.value;
    const decodePrompt = document.getElementById("stageFourDecodePrompt");
    if (decodePrompt instanceof HTMLTextAreaElement) {
      decodePrompt.value = buildAdversarialDecodeChatPrompt();
    }
    const decodeButton = document.querySelector("[data-stage-four-decode-copy]");
    if (decodeButton instanceof HTMLButtonElement) {
      decodeButton.disabled = !state.stageFourImageEvidence.trim();
    }
    return;
  }
  if (target.id === "stageFourCritiqueReport") {
    state.stageFourCritiqueReport = target.value;
    document.querySelectorAll("[data-stage-four-report-action]").forEach((node) => {
      if (node instanceof HTMLButtonElement) {
        node.disabled = !state.stageFourCritiqueReport.trim();
      }
    });
    return;
  }
  if (target.id === "traceJsonInput") {
    state.traceJsonInput = target.value;
    const applyButton = document.querySelector('[data-action="apply-trace-json"]');
    if (applyButton instanceof HTMLButtonElement) {
      applyButton.disabled = !state.traceJsonInput.trim();
    }
    return;
  }
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
  if (target.id === "socraticInput" && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    sendSocraticMessage();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.id === "stageFourImageFile") {
    loadStageFourImageFile(target.files?.[0]);
  }
  if (target.id === "stageFiveImageFile") {
    loadTraceImageFile(target.files?.[0]);
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "add-anchor") addAnchor();
  if (action === "remove-anchor") removeAnchor(Number(button.dataset.index));
  if (action === "send-socratic") sendSocraticMessage();
  if (action === "reset-socratic") resetSocraticFlow();
  if (action === "run-stage-two") runStageTwoTranslation();
  if (action === "critique-uploaded-image") critiqueUploadedImage();
  if (action === "generate-trace") generateCulturalTrace();
  if (action === "apply-trace-json") applyTraceJsonInput();
  if (action === "select-trace") {
    state.selectedTraceId = button.dataset.id || "";
    render();
  }
  if (action === "run-stage-four") runStageFourDecode();
  if (action === "save-stage-four-critique") saveCurrentStageFourCritique();
  if (action === "accept-stage-four") acceptStageFourCritique();
  if (action === "ignore-stage-four") ignoreStageFourCritique();
  if (action === "partial-stage-four") partialAcceptStageFourCritique();
  if (action === "copy-cpe") copyText(JSON.stringify(toTranslatorDirective(finalPayload()), null, 2), "当前CPE");
  if (action === "copy-generation-package") copyText(JSON.stringify(buildGenerationPackage(), null, 2), "图像生成交接包");
  if (action === "copy-image-prompt") copyText(buildImageGenerationChatPrompt(), "生图指令");
  if (action === "copy-trace-prompt") copyText(buildCulturalTraceChatPrompt(), "文化溯源提示词");
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
