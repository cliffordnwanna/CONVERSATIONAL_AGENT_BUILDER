import { NextRequest, NextResponse } from 'next/server';

// Simple web scraping implementation
// In production, you might want to use a more sophisticated scraping service
// or proxy through a service that handles JavaScript rendering

async function scrapeWebsite(url: string): Promise<{
  title: string;
  content: string;
  description: string;
  success: boolean;
  error?: string;
}> {
  try {
    // Basic validation
    if (!url || !url.startsWith('http')) {
      return {
        title: '',
        content: '',
        description: '',
        success: false,
        error: 'Invalid URL provided'
      };
    }

    // For demo purposes, we'll simulate scraping
    // In production, you could use:
    // 1. Puppeteer/Playwright for JavaScript-heavy sites
    // 2. Cheerio for simple HTML parsing
    // 3. External API like ScrapingBee or ScraperAPI
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Simple text extraction (basic implementation)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
    
    // Remove HTML tags and extract text content
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to 5000 characters for demo

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const description = descMatch ? descMatch[1].trim().substring(0, 200) : '';

    return {
      title,
      content: textContent,
      description,
      success: true
    };

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      title: '',
      content: '',
      description: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape website'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Rate limiting check (simple implementation)
    const now = Date.now();
    
    // In production, you'd use Redis or database for rate limiting
    const rateLimitKey = `scrape_${Date.now()}`;
    
    const result = await scrapeWebsite(url);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Add rate limiting middleware in production
export const dynamic = 'force-dynamic';
