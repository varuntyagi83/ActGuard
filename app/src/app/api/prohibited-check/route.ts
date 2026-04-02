import { NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROHIBITED_PRACTICES = [
  {
    id: 1,
    label: "Subliminal manipulation",
    description:
      "Subliminal techniques beyond a person's conscious awareness that materially distort behaviour in a way that causes or is likely to cause harm.",
  },
  {
    id: 2,
    label: "Exploiting vulnerabilities of specific groups",
    description:
      "Exploiting vulnerabilities of specific groups due to age, disability, or social/economic situation in a way that causes or is likely to cause harm.",
  },
  {
    id: 3,
    label: "Social scoring by public authorities",
    description:
      "AI systems used by public authorities for evaluating or classifying individuals based on social behaviour or personal characteristics leading to detrimental or disproportionate treatment.",
  },
  {
    id: 4,
    label: "Real-time remote biometric identification in public spaces",
    description:
      "Real-time remote biometric identification systems in publicly accessible spaces for law enforcement purposes (subject to narrow exceptions).",
  },
  {
    id: 5,
    label: "Biometric categorisation inferring sensitive attributes",
    description:
      "Biometric categorisation systems that categorise individuals based on biometric data to infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation.",
  },
  {
    id: 6,
    label: "Emotion recognition in workplace or education",
    description:
      "AI systems used to infer emotions of natural persons in the context of workplace or educational institutions (except for medical or safety reasons).",
  },
  {
    id: 7,
    label: "Untargeted facial image scraping",
    description:
      "Untargeted scraping of facial images from the internet or CCTV footage to create or expand facial recognition databases.",
  },
  {
    id: 8,
    label: "Predictive policing based solely on profiling",
    description:
      "AI systems used for risk assessments of natural persons in order to predict the commission of criminal offences based solely on profiling or assessing personality traits.",
  },
];

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole("viewer");
    if (error) return error;

    const body = await req.json();
    const { description } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: "A system description of at least 10 characters is required." },
        { status: 400 }
      );
    }

    const practicesList = PROHIBITED_PRACTICES.map(
      (p) => `${p.id}. ${p.label}: ${p.description}`
    ).join("\n");

    const prompt = `You are an EU AI Act compliance expert. Analyze the following AI system description against each of the 8 prohibited AI practices listed in Article 5 of the EU AI Act.

AI System Description:
"""
${description.trim()}
"""

Prohibited Practices:
${practicesList}

For each practice, independently assess whether this system description raises concerns.
Return a JSON object with a "results" array. Each element must have:
- "practiceId": integer (1-8)
- "practice": string (the label)
- "verdict": one of "prohibited", "unclear", or "compliant"
  - "prohibited": the description strongly suggests this practice applies
  - "unclear": there are aspects that could implicate this practice; human review needed
  - "compliant": no indication this practice applies
- "explanation": 1-2 sentences explaining your reasoning

Be conservative: when in doubt, lean towards "unclear" rather than "compliant". Base your assessment solely on what the description states.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an EU AI Act compliance expert. Always respond with valid JSON matching the requested schema.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content;
    if (!raw) {
      return NextResponse.json(
        { error: "No response from AI model." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw);
    const results = parsed.results as Array<{
      practiceId: number;
      practice: string;
      verdict: "prohibited" | "unclear" | "compliant";
      explanation: string;
    }>;

    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("Prohibited check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
