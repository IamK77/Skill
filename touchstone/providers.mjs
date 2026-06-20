// providers.mjs — the one place that knows how to talk to a model.
//
// Two run modes, one interface, so the same engine runs in either:
//   • claude.ai artifact   → flavor 'anthropic-proxy': POST api.anthropic.com with
//     NO key. claude.ai injects authorization. (This runs in the browser directly.)
//   • local / your own key → flavor 'openai' (DeepSeek / dsv4 and any other
//     OpenAI-compatible endpoint) or 'anthropic' (keyed). The config is typed into
//     the web UI and handed to the local server per request — it is NOT read from
//     env, and the key reaches only your own machine's server (CORS-safe).
//
// makeCallModel(cfg) returns:  async (messages, opts) => string
//   cfg:      { flavor, baseUrl?, apiKey?, model? }
//   messages: [{ role:'user'|'assistant', content }]
//   opts:     { system?, maxTokens?, temperature?, model? }

const textFromAnthropic = (data) =>
  (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");

// Surface prompt-cache hits to stderr so a multi-turn run's real cost is VISIBLE and
// verifiable (a cache read is billed ~0.1x a fresh input token). Silent if the
// endpoint reports no cache fields. Goes to stderr so it never pollutes stdout JSON.
function logCacheUsage(u) {
  if (!u) return;
  const w = u.cache_creation_input_tokens || 0, r = u.cache_read_input_tokens || 0;
  if (w || r) console.error(`  [cache] write=${w} read=${r} in=${u.input_tokens || 0} out=${u.output_tokens || 0}`);
}

// A thinking model (DeepSeek v4-pro etc.) returns its chain-of-thought in
// `reasoning_content` and the actual answer in `content`, both at message level.
// We use `content`. If it is blank we look at finish_reason: "length" means the
// reasoning ate the whole budget and the answer got cut off — a clear, actionable
// error (raise max_tokens) instead of a silent empty string that scores as a bad
// review. The thinking is preserved (the model runs it in full); we just read the
// right field and never truncate it.
function answerFromOpenAI(data) {
  const choice = data?.choices?.[0] ?? {};
  const content = (choice.message?.content ?? "").trim();
  if (content) return content;
  if (choice.finish_reason === "length") {
    throw new Error("answer truncated (finish_reason=length): the model's reasoning used the whole token budget before the answer — raise max_tokens");
  }
  throw new Error(`model returned empty content (finish_reason=${choice.finish_reason ?? "?"})`);
}

async function postJSON(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from ${url}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export function makeCallModel(cfg = {}) {
  const {
    flavor = "anthropic-proxy",
    baseUrl,
    apiKey,
    model: defaultModel,
    anthropicVersion = "2023-06-01",
  } = cfg;

  // ── Anthropic messages API (proxy = no key on claude.ai; keyed = local) ──────
  if (flavor === "anthropic-proxy" || flavor === "anthropic") {
    const root = baseUrl || "https://api.anthropic.com";
    return async (messages, opts = {}) => {
      const headers = {};
      if (flavor === "anthropic") {
        if (!apiKey) throw new Error("flavor 'anthropic' needs an API key");
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = anthropicVersion;
      }
      const body = {
        model: opts.model || defaultModel || "claude-sonnet-4-6",
        max_tokens: opts.maxTokens ?? 1500,
        messages,
      };
      // Cache the system block. In the harness this is the big, turn-stable SKILL.md;
      // marking it cacheable means a multi-turn run reads it from cache each turn
      // instead of re-billing the whole skill every turn — the real cost of running a
      // skill, the way Claude Code itself caches it. Sent as a content block (Anthropic
      // shape) so cache_control can attach. Below the model's min cacheable size it is a
      // silent no-op, so it is safe to always set; the real Anthropic API and DeepSeek's
      // Anthropic-compatible endpoint both accept the block form.
      if (opts.system) {
        body.system = [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }];
      }
      if (opts.temperature != null) body.temperature = opts.temperature;
      const data = await postJSON(`${root}/v1/messages`, headers, body);
      logCacheUsage(data.usage);
      return textFromAnthropic(data);
    };
  }

  // ── OpenAI-compatible chat API (DeepSeek / dsv4 / vLLM / ollama / …) ─────────
  if (flavor === "openai") {
    if (!baseUrl) throw new Error("flavor 'openai' needs a base URL (e.g. https://api.deepseek.com/v1)");
    return async (messages, opts = {}) => {
      // OpenAI carries the system prompt as the first message, not a top field.
      const msgs = opts.system ? [{ role: "system", content: opts.system }, ...messages] : messages;
      const body = {
        model: opts.model || defaultModel,
        messages: msgs,
        max_tokens: opts.maxTokens ?? 1500,
      };
      if (opts.temperature != null) body.temperature = opts.temperature;
      const headers = apiKey ? { authorization: `Bearer ${apiKey}` } : {};
      return answerFromOpenAI(await postJSON(`${baseUrl}/chat/completions`, headers, body));
    };
  }

  throw new Error(`unknown flavor "${flavor}" (use anthropic-proxy | anthropic | openai)`);
}
