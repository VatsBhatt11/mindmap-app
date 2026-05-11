const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `You are a mindmap generation assistant. Return ONLY valid JSON — no prose, no markdown fences.

Schema:
{
  "nodes": [
    { "id": "string", "label": "string", "details": "markdown string", "color": "#hexcolor" }
  ],
  "edges": [
    { "source": "string", "target": "string" }
  ]
}

Rules:
- Node ids must be unique strings (use simple incrementing numbers: "1", "2", …).
- The first node in the array is always the root.
- Choose distinct, visually appealing hex colors for each node.
- details may contain markdown (headings, lists, code blocks) for the rich-text modal.
- edges connect parent → child by id.
- Return 6–20 nodes for a full mindmap; 3–8 nodes when expanding a single branch.`;

async function generate(req, res) {
  // const { prompt, apiKey, model, selectedNode } = req.body; // BYOK disabled — key & model come from env
  const { prompt, selectedNode } = req.body;

  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // API key and model are server-side — never exposed to the client
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured on server.' });

  const groq = new Groq({ apiKey });

  const userMessage = selectedNode
    ? `Expand the mindmap node "${selectedNode.label}" with relevant child nodes. Context: ${prompt}`
    : `Create a complete mindmap for: ${prompt}`;

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: 'Empty response from Groq' });

    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return res.status(500).json({ error: 'Invalid JSON structure from AI' });
    }

    res.json(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned malformed JSON. Try again.' });
    }
    res.status(500).json({ error: err.message });
  }
}

module.exports = { generate };
