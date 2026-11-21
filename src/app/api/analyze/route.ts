import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/analyzer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message text is required.' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 5000 characters.' },
        { status: 400 }
      );
    }

    const result = await analyzeMessage(message);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API /api/analyze error:', error);
    return NextResponse.json(
      { error: 'Internal threat analysis error occurred.' },
      { status: 500 }
    );
  }
}
