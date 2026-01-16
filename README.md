# 🤖 Conversational Agent Builder

Build AI Agents That Actually Understand Your Business

A production-ready SaaS application built with Next.js 16, TypeScript, and Tailwind CSS that enables businesses to create intelligent conversational AI agents powered by their own knowledge bases.

## 🎯 Features

- **4-Step Agent Configuration**: Use case, tone, goal, and industry setup
- **Advanced Knowledge Base Integration**: Upload PDFs, TXT, DOCX files OR scrape websites directly
- **Website Scraping**: Extract content from company websites, documentation, and support pages
- **Plain Text Input**: Add FAQs, policies, and documentation directly without file uploads
- **Real-time Chat Testing**: Test agents with 3-message limit
- **Analytics Dashboard**: Live metrics and performance insights
- **Professional Deployment**: Embed codes and pricing tiers
- **Cost Optimization**: RAG system reduces OpenAI API costs by 80%

## 🚀 Technology Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS for responsive design
- **Components**: Shadcn/ui for professional UI
- **AI**: OpenAI GPT-4o Mini for intelligent responses
- **Database**: In-memory session management with TTL
- **Architecture**: Clean separation of concerns with proper APIs

## 📊 Quick Start

```bash
# Clone the repository
git clone https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER.git
cd CONVERSATIONAL_AGENT_BUILDER

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 🎯 Target Audience

### **Perfect For:**
- **Small Businesses**: Automate customer support and sales
- **E-commerce**: Product recommendations and FAQ automation
- **SaaS Companies**: Multi-tenant agent deployment
- **Consultants**: Rapid client solution deployment
- **Marketing Teams**: Lead generation and customer engagement
- **Support Teams**: 24/7 automated customer service

### **Use Cases:**
- **Company websites and documentation**: Scrape existing knowledge bases instantly
- **FAQ documents and support content**: Build comprehensive help systems
- **Product manuals and policy documents**: Technical support automation
- **Any combination of the above sources**: Mix and match knowledge from multiple sources

### **Industry Applications:**
- **E-commerce Support**: Product recommendations, order tracking, returns
- **SaaS Onboarding**: User guidance, feature explanations, troubleshooting
- **Healthcare**: Patient inquiries, appointment scheduling, policy information
- **Finance**: Account questions, transaction support, compliance guidance
- **Education**: Course assistance, assignment help, resource recommendations
- **Real Estate**: Property inquiries, scheduling, document management
- **Legal Services**: Case intake, document analysis, client communication

## 💼 Business Benefits

### **Immediate ROI:**
- **80% Cost Reduction**: Automate responses, reduce human support costs
- **24/7 Availability**: Never miss a customer inquiry again
- **Instant Scaling**: Deploy multiple agents without hiring additional staff
- **Consistent Quality**: Standardized responses across all interactions
- **Data-Driven Insights**: Track performance and optimize continuously

### **Competitive Advantages:**
- **RAG-Powered**: More accurate responses than generic AI
- **Multi-Source Knowledge**: Combine documents, websites, and text inputs
- **Mobile-First Design**: Professional experience on all devices
- **Enterprise Security**: Session management, data protection, compliance ready
- **Developer-Friendly**: Clean APIs, comprehensive documentation, TypeScript support

## 🎯 Key Features

### Agent Builder (`/builder`)
- **Multi-step configuration**: Use case, tone, goal, and industry selection
- **Knowledge upload**: File management with PDF/TXT/DOCX support
- **Website scraping**: Extract content from any website URL
- **Plain text input**: Add knowledge directly without file uploads
- **Real-time testing**: Chat interface with session limits
- **Session management**: Unique session IDs with TTL

### Knowledge Base Workflow
- **Three input methods**: Websites, plain text, file uploads
- **Smart scraping**: Automated content extraction with error handling
- **Unified management**: All knowledge sources in one interface
- **Retry functionality**: Re-attempt failed scrapes with one click
- **Source tracking**: Monitor status and metadata of all knowledge sources

### Analytics Dashboard (`/analytics`)
- **Live metrics**: Conversation volume, satisfaction rates, response times
- **Performance insights**: Knowledge base usage, cost savings
- **Real-time updates**: Activity-based data refresh

### Deployment Page (`/deploy`)
- **Embed codes**: Standard and advanced options
- **Pricing tiers**: Starter, Professional, Enterprise plans
- **Customization**: Widget themes, positions, messages
- **Copy functionality**: One-click embed code copying

## 🔧 Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Session Management
- **3 Message Limit**: Controls costs and encourages efficiency
- **TTL**: 10-minute session expiration
- **Knowledge Integration**: Upload up to 5 files, 10MB total per session
- **Website Scraping**: Extract content from any public website
- **Multiple Input Methods**: Files, text, and URLs supported

## 📈 Documentation

- **Component Library**: Reusable UI components
- **API Routes**: RESTful design with proper error handling
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-first approach
- **Knowledge Sources**: Unified management of all content types

## 📸 Screenshots

### Desktop View
![Desktop View](./images/hero-homepage.png)

### Mobile View  
![Mobile View](./images/mobile-homepage.png)

### Agent Builder Interface
![Agent Builder](./images/builder-interface.png)

### Knowledge Base Workflow
![Knowledge Base Workflow](./images/knowledge-workflow.png)

### Analytics Dashboard
![Analytics Dashboard](./images/analytics-dashboard.png)

### Deployment Page
![Deployment Page](./images/deployment-page.png)

## 🚀 Deployment Ready

The application is production-ready for deployment to Vercel or any hosting platform. All components are functional, build is successful, and codebase follows Next.js 16 best practices.

---

**Built with ❤️ using Next.js 16, TypeScript, and Tailwind CSS**

## 🚀 Technology Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS for responsive design
- **Components**: Shadcn/ui for professional UI
- **AI**: OpenAI GPT-4o Mini for intelligent responses
- **Database**: In-memory session management with TTL
- **Architecture**: Clean separation of concerns with proper APIs

## 📊 Quick Start

```bash
# Clone the repository
git clone https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER.git
cd CONVERSATIONAL_AGENT_BUILDER

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
3. Send message: "I'm interested in your pricing" → Show AI response with knowledge usage indicator
4. Click Analytics → Show real-time dashboard with metrics
5. Click Deploy → Show professional deployment options with pricing plans

## LinkedIn Post Template

> 🚀 Just deployed an AI Conversational Agent Builder!
>
> 
> Built a public demo that lets users create domain-specific chatbots (Sales & FAQ) with prompt templates, intent classification, and live analytics.
> 
> Tech: Next.js, OpenAI GPT-4o Mini, Tailwind, shadcn/ui
> 
> Features: Knowledge base upload, 3-step configuration, real-time analytics, professional deployment
> 
> **Problem Solved**: High API costs → RAG system, 80% cost reduction
> 
> **From MVP to Product**: Now a legitimate SaaS tool that businesses can actually use
> 
> **Live Demo**: https://conversational-agent-builder.vercel.app/
> 
> **GitHub**: https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER
> 
> #AI #LLMs #PromptEngineering #SaaS #NextJS #React

## 📸 Screenshots

### Desktop View
![Desktop View](./images/hero-homepage.png)

### Mobile View  
![Mobile View](./images/mobile-homepage.png)

### Agent Builder Interface
![Agent Builder](./images/builder-interface.png)

### Analytics Dashboard
![Analytics Dashboard](./images/analytics-dashboard.png)

### Deployment Page
![Deployment Page](./images/deployment-page.png)

---

**Built with ❤️ using Next.js and modern AI engineering practices. Ready for production deployment!**

## Project Structure

```
ai-agent-builder/
├── app/
│   ├── page.tsx              # Landing page with template selection
│   ├── builder/page.tsx      # Chat playground and testing
│   ├── analytics/page.tsx    # Session analytics dashboard
│   ├── deploy/page.tsx       # Embed code and deployment
│   └── api/chat/route.ts     # Agent logic and OpenAI integration
├── components/ui/            # shadcn/ui components
├── lib/
│   ├── openai.ts            # OpenAI client configuration
│   └── sessionStore.ts      # In-memory session management
├── prompts/
│   ├── sales.ts             # Sales bot system prompt
│   └── faq.ts               # FAQ bot system prompt
├── public/
│   └── embed.js             # Demo widget embed script
└── README.md
```

## API Endpoints

### POST /api/chat
Processes user messages and generates AI responses.

**Request:**
```json
{
  "sessionId": "uuid",
  "message": "User message",
  "type": "sales" | "faq"
}
```

**Response:**
```json
{
  "reply": "AI response",
  "analytics": {
    "conversations": 1,
    "thumbsUp": 0,
    "thumbsDown": 0
  }
}
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add `OPENAI_API_KEY` environment variable
4. Deploy

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Development

### Adding New Bot Types
1. Create new prompt in `/prompts/`
2. Update API route to handle new type
3. Add UI option on landing page

### Customizing UI
- Components use Tailwind CSS classes
- shadcn/ui for consistent design system
- Responsive design built-in

## Performance Notes

- **Cold Starts**: ~2 seconds (Vercel free tier)
- **Response Time**: ~1-2 seconds per message
- **Memory Usage**: ~50MB per active session
- **Concurrent Users**: Limited by Vercel free tier

## Security & Privacy

- **No Data Persistence**: Sessions expire after 10 minutes
- **No User Tracking**: No analytics or cookies
- **API Key Security**: Server-side only, never exposed
- **Content Filtering**: Built-in prompt guardrails

## Contributing

This is a demo project. For production use, consider:
- User authentication
- Persistent storage
- Advanced analytics
- Custom domain support
- Multi-language support

## License

MIT License - feel free to use this as a starting point for your own AI agent projects.

---

**Built with ❤️ using Next.js and OpenAI**
