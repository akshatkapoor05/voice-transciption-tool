import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: `Paraphrase the following text clearly without changing meaning:\n\n${text}`,
          parameters: {
            max_length: 300,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await hfRes.json();

    // Handle model-loading case
    if (data?.error || data?.estimated_time) {
      return res.status(503).json({
        error: "Model is loading, please try again",
      });
    }

    const paraphrased =
      Array.isArray(data) && data[0]?.summary_text
        ? data[0].summary_text
        : null;

    if (!paraphrased) {
      return res.status(500).json({ error: "Paraphrasing failed" });
    }

    res.status(200).json({ paraphrased });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
