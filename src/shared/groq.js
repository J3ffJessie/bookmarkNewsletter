const API_URL = "https://api.groq.com/openai/v1/chat/completions";

function groupingLabel(grouping) {
  if (grouping === "tag") return "the tag provided with each bookmark";
  if (grouping === "date") return "the date each bookmark was saved";
  return "theme or topic";
}

function detailInstruction(detail) {
  if (detail === "brief") {
    return "For each bookmark, write a short blurb (1-2 sentences) explaining what it's about and why it might be worth reading.";
  }
  return [
    "For each bookmark, write a detailed write-up (roughly 4-6 sentences or a short paragraph) that covers: what the page/article is specifically about, the key points, facts, or details it mentions, and an overarching takeaway or conclusion the reader should walk away with.",
    "Mine the excerpt and note for specifics (numbers, names, claims, findings) instead of staying generic — only fall back to a shorter, more general summary if the excerpt is too thin to say anything specific.",
  ].join(" ");
}

function buildSystemPrompt(preferences) {
  const { tone, length, grouping, detail } = preferences;
  return [
    "You are a newsletter editor helping a reader make sense of articles they bookmarked while browsing.",
    `Write in a ${tone} tone.`,
    `Aim for a ${length} overall length.`,
    `Group the bookmarks by ${groupingLabel(grouping)}, with a clear section header per group.`,
    detailInstruction(detail),
    "Drawing on the title, URL, note, and excerpt provided for each bookmark, and never inventing details that aren't supported by them.",
    "Structure the output as Markdown: a short intro, themed sections with headers, a write-up per article that links to its URL, and a brief sign-off.",
  ].join(" ");
}

function buildUserPrompt(bookmarks) {
  const lines = bookmarks.map((b, i) => {
    const parts = [`${i + 1}. Title: ${b.title}`, `   URL: ${b.url}`];
    if (b.tag) parts.push(`   Tag: ${b.tag}`);
    if (b.note) parts.push(`   Note: ${b.note}`);
    if (b.excerpt) parts.push(`   Excerpt: ${b.excerpt}`);
    parts.push(`   Saved: ${b.savedAt}`);
    return parts.join("\n");
  });
  return `Here are the bookmarked articles to include in this newsletter:\n\n${lines.join("\n\n")}`;
}

export async function generateNewsletter({ apiKey, model, bookmarks, preferences }) {
  if (!apiKey) {
    throw new Error("Add your Groq API key in Settings before generating a newsletter.");
  }
  if (!bookmarks || !bookmarks.length) {
    throw new Error("Select at least one bookmark to include.");
  }

  const tokensPerBookmark = preferences.detail === "brief" ? 150 : 350;
  const maxTokens = Math.min(8000, 800 + tokensPerBookmark * bookmarks.length);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: buildSystemPrompt(preferences) },
        { role: "user", content: buildUserPrompt(bookmarks) },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody?.error?.message || "";
    } catch (err) {
      // response body wasn't JSON; fall back to statusText below
    }
    throw new Error(`Groq API error (${response.status}): ${detail || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
