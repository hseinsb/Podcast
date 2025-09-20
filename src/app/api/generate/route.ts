import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { mainIdea, keyTakeaways, centralProblem } = await request.json();

    const prompt = `
Based on the following podcast content, generate creative ideas for social media and monetization:

Main Idea: ${mainIdea || ''}
Key Takeaways: ${(keyTakeaways || []).join('; ')}
Central Problem: ${centralProblem || ''}

Generate the following in JSON format:

1. socialMediaHooks: 3-5 engaging social media hooks using the E-M-V (Emotion-Mystery-Value) framework
2. contentTopics: 2-3 content topics perfect for videos, blogs, or scripts  
3. monetizationIdeas: 1-2 monetization ideas (digital products, physical products, or services)

Rules:
- Make hooks attention-grabbing and shareable
- Content topics should be specific and actionable
- Monetization ideas should be realistic and aligned with the content
- Return ONLY valid JSON with no additional text
- Keep each item concise but compelling

Example format:
{
  "socialMediaHooks": ["Hook 1", "Hook 2", "Hook 3"],
  "contentTopics": ["Topic 1", "Topic 2"],
  "monetizationIdeas": ["Idea 1", "Idea 2"]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a creative content strategist and marketing expert. Generate engaging, actionable content ideas based on podcast summaries. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
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
    console.error('Error generating content ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate content ideas' },
      { status: 500 }
    );
  }
}
