import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { rawText } = await request.json();

    if (!rawText) {
      return NextResponse.json(
        { error: 'Raw text is required' },
        { status: 400 }
      );
    }

    const prompt = `
Parse the following NotebookLM podcast summary into structured JSON. Extract information for these exact fields only:

- title: The podcast or episode title
- speaker: The main speaker/guest name  
- mainIdea: The core concept or main idea
- keyTakeaways: Array of key takeaways or lessons
- centralProblem: The main problem being discussed
- strengths: Array of strengths mentioned
- weaknesses: Array of weaknesses mentioned  
- counterarguments: Array of counterarguments presented
- practicalLessons: Array of practical lessons or advice
- twoMinuteVersion: Array of points for a 2-minute summary
- actionChecklist: Array of actionable items or steps

Rules:
1. Return ONLY valid JSON with the exact field names above
2. Use empty arrays [] for missing list fields
3. Use empty strings "" for missing text fields
4. Preserve bullet points and formatting within strings
5. Do not duplicate content across fields
6. If a section is not found, leave that field empty

Text to parse:
${rawText}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise text parser that extracts structured data from podcast summaries. Return only valid JSON without any additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({ data: parsed });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return NextResponse.json(
        { error: 'Invalid JSON response from OpenAI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error parsing NotebookLM text:', error);
    return NextResponse.json(
      { error: 'Failed to parse NotebookLM text' },
      { status: 500 }
    );
  }
}
