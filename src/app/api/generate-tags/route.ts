import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const { title, mainIdea, keyTakeaways, centralProblem, speaker } = await request.json();

    const prompt = `
Analyze the following podcast content and generate 3-7 precise topic tags that represent the core themes and subjects discussed.

Podcast Details:
Title: ${title || 'N/A'}
Speaker: ${speaker || 'N/A'}
Main Idea: ${mainIdea || 'N/A'}
Key Takeaways: ${(keyTakeaways || []).join('; ')}
Central Problem: ${centralProblem || 'N/A'}

Requirements:
1. Generate 3-7 specific topic tags that capture the main themes
2. Tags should be 1-3 words each (e.g., "Marketing", "AI Tools", "Personal Finance")
3. Focus on the core subject matter, not peripheral mentions
4. Use proper case (Title Case)
5. Be specific but broad enough for categorization
6. Return ONLY a JSON array of tag strings

Examples of good tags:
- "Entrepreneurship"
- "Digital Marketing"
- "Personal Finance"
- "AI & Technology"
- "Leadership"
- "Content Creation"
- "Cryptocurrency"
- "Mental Health"
- "Productivity"
- "Investment Strategy"

Return format:
["Tag 1", "Tag 2", "Tag 3"]
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise content categorization expert. Generate semantic topic tags that accurately represent the core themes of podcast content. Return only a JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      const tags = JSON.parse(content);
      
      // Validate tags array
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Invalid tags format');
      }
      
      // Clean and validate each tag
      const cleanTags = tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim())
        .slice(0, 7); // Limit to 7 tags max
      
      return NextResponse.json({ data: cleanTags });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return NextResponse.json(
        { error: 'Invalid JSON response from OpenAI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating tags:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
}

