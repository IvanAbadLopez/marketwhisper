# 🎥 MarketWhisper - Video Script

> **Target Duration**: 10-15 minutes  
> **Format**: Screen recording + narration (+ optional webcam)  
> **Platform**: YouTube / Google Drive (public access)

---

## 📋 Pre-Recording Checklist

### Technical Setup:
- [ ] Screen recording software ready (OBS, Loom, Camtasia, etc.)
- [ ] Microphone tested (clear audio)
- [ ] Browser window maximized (1920x1080 recommended)
- [ ] Notifications disabled (Do Not Disturb mode)
- [ ] Browser zoom at 100%
- [ ] Clear browser cache/cookies if needed
- [ ] Test recording (5 seconds) to verify quality

### Content Setup:
- [ ] Open https://marketwhisper.vercel.app in clean browser tab
- [ ] Demo credentials ready: demo@marketwhisper.com / MarketWhisper2026!
- [ ] Example text prepared (see below)
- [ ] Notes/script visible on second monitor or printed

---

## 🎬 Video Structure

### Total Duration: ~12 minutes

1. **Introduction** (1 min)
2. **Problem & Solution** (1 min)
3. **Live Demo - Part 1: Authentication** (1 min)
4. **Live Demo - Part 2: Text Analysis** (3 min)
5. **Live Demo - Part 3: Company Dashboard** (2 min)
6. **Technical Overview** (2 min)
7. **Testing & Security** (1 min)
8. **Conclusion & Repository** (1 min)

---

## 📝 Detailed Script

### SCENE 1: Introduction (1 minute)

**[SCREEN: Desktop or browser homepage]**

**NARRATION**:
> "Hello! My name is Ivan Abad López, and today I'm presenting MarketWhisper, my Master's Thesis project. MarketWhisper is an AI-powered market intelligence platform that helps investors and analysts automatically analyze financial texts using artificial intelligence.

> In this video, I'll show you how the application works, demonstrate its key features, and explain the technology stack behind it. Let's get started!"

**ACTION**: Open browser tab with https://marketwhisper.vercel.app

---

### SCENE 2: Problem & Solution (1 minute)

**[SCREEN: Still on homepage, scroll to show overview]**

**NARRATION**:
> "The problem we're solving is information overload in financial markets. Every day, investors face thousands of news articles, tweets, and analyst reports. Manually analyzing all this content is time-consuming and prone to bias.

> MarketWhisper automates this process. You simply paste any financial text—a news article, a tweet, an analyst report—and our AI analyzes it to detect which companies are mentioned, determines the sentiment for each company, and provides a reliability score with detailed reasoning.

> The platform also tracks historical sentiment, enriches companies with real-time financial data from Finnhub, and calculates a comprehensive investment score from 0 to 100."

**ACTION**: Scroll down to show key features section

---

### SCENE 3: Demo - Authentication (1 minute)

**[SCREEN: Click "Sign In" button]**

**NARRATION**:
> "Let me show you the application in action. First, I'll log in using our demo account. The platform uses NextAuth.js for secure authentication, supporting both email/password and OAuth providers like Google and GitHub."

**ACTION**: 
- Navigate to login page
- Type: demo@marketwhisper.com
- Type: MarketWhisper2026!
- Click "Sign In"

**NARRATION**:
> "And we're in! This is the home dashboard, showing our current statistics: companies tracked, text analyses performed, AI reports generated, and active background processes."

**ACTION**: Briefly show home page stats

---

### SCENE 4: Demo - Text Analysis (3 minutes)

**[SCREEN: Navigate to "Analyze Text" page]**

**NARRATION**:
> "Now let's analyze some financial text. I'll click on 'Analyze Text' in the navigation menu."

**ACTION**: Click "Analyze Text" link

**NARRATION**:
> "Here's the analysis form. I can paste any financial text here. Let me use an example that mentions multiple companies."

**ACTION**: Type or paste this example:
```
Apple reported strong Q4 earnings with iPhone revenue up 8%, beating analyst 
expectations. The company also announced a $90B share buyback program. Meanwhile, 
Microsoft warned of slowing cloud growth, causing shares to drop 3% in after-hours 
trading. Tesla delivered record vehicles this quarter, with Cybertruck production 
ramping up faster than expected.
```

**NARRATION**:
> "I've pasted a text mentioning three companies: Apple with positive earnings news, Microsoft with cloud concerns, and Tesla with strong delivery numbers. Notice how MarketWhisper can analyze multiple companies in a single text—this is one of its key features.

> Now I'll click 'Analyze' to submit this text."

**ACTION**: Click "Analyze" button

**NARRATION**:
> "The analysis is now running in the background. The system creates a job that's processed asynchronously, so I can continue using the app while the AI works. Let's check the job queue to see the progress."

**ACTION**: Navigate to "Jobs" page

**NARRATION**:
> "Here in the job queue, we can see our analysis job is being processed. It shows real-time status updates. The AI is using Groq's llama-3.3-70b-versatile model, which typically completes analysis in 2 to 5 seconds."

**ACTION**: Wait for job to complete (or refresh if needed)

**NARRATION**:
> "And it's done! The job is now marked as 'Completed'. Let's navigate to the Companies page to see the results."

**ACTION**: Click "Companies" in navigation

---

### SCENE 5: Demo - Company Dashboard (2 minutes)

**[SCREEN: Companies list page]**

**NARRATION**:
> "Here we can see all the companies that have been analyzed. Each card shows the ticker symbol, company name, and most importantly, the Global Investment Score—a comprehensive 0-to-100 score that combines fundamental analysis, technical indicators, sentiment analysis, and analyst recommendations.

> Let's click on Apple to see detailed analysis."

**ACTION**: Click on AAPL company card

**[SCREEN: Apple company detail page]**

**NARRATION**:
> "This is the company detail page. At the top, we see Apple's logo, current price, and global score. Below that, we have several sections:

> First, the 'Analyses' section shows all the text analyses we've performed for this company. You can see the sentiment—in this case, BULLISH—with a reliability score of 8 out of 10. The AI also provides detailed reasoning explaining why it classified this as bullish sentiment.

> If I scroll down, I can see the company enrichment section."

**ACTION**: Scroll to enrichment section

**NARRATION**:
> "This enrichment data comes from the Finnhub API and includes real-time information: current stock price, market cap, P/E ratio, and other key metrics. There's also a feed of recent news articles about the company, and analyst recommendations showing the distribution of buy, hold, and sell ratings.

> Our AI has also generated a comprehensive analysis summary based on all this data, which helps investors make informed decisions.

> I can click 'Enrich Company' to refresh this data at any time."

**ACTION**: Optionally show enrichment button (don't click unless needed)

**NARRATION**:
> "The platform also supports deleting analyses or entire companies if needed, and all metrics are recalculated automatically to maintain data integrity."

---

### SCENE 6: Technical Overview (2 minutes)

**[SCREEN: Open GitHub repository or show code editor]**

**NARRATION**:
> "Now let me show you the technology behind MarketWhisper. Let me open the GitHub repository."

**ACTION**: Navigate to https://github.com/IvanAbadLopez/marketwhisper

**NARRATION**:
> "The project is fully open source and available on GitHub. Let's look at the key technologies:

> **Frontend**: Built with Next.js 16 using the App Router, React 19, and TypeScript in strict mode. The UI uses Tailwind CSS and shadcn/ui components for a modern, responsive design.

> **Backend**: Next.js API routes handle all backend logic. The database is PostgreSQL 16 with Prisma 7 as the ORM. Authentication is handled by NextAuth.js version 5.

> **AI & Data**: For AI analysis, we use Groq's API with the llama-3.3-70b-versatile model, which provides fast and accurate sentiment analysis. Financial data comes from the Finnhub API.

> **Deployment**: The application is deployed on Vercel using their serverless platform, with a Neon PostgreSQL serverless database. This entire stack runs on free tiers, so there are zero operational costs.

> The project follows Feature-Sliced Design architecture, which you can see in the source code structure."

**ACTION**: Show src/ directory structure briefly

**NARRATION**:
> "We have organized code into layers: entities for business models, features for user-facing functionality, widgets for complex UI components, and shared utilities.

> The application includes comprehensive testing with Vitest for unit tests and Playwright for end-to-end tests. Currently, we have 233 passing unit tests covering business logic, components, and API routes."

**ACTION**: Show test files or run `npm test -- --run` if time allows

---

### SCENE 7: Security & Quality (1 minute)

**[SCREEN: Show README security section or CI/CD workflow]**

**NARRATION**:
> "Security was a priority from the start. We've implemented OWASP Top 10 protections including:

> - Rate limiting on all public endpoints to prevent abuse
> - Robust input validation for email, passwords, and user text
> - Security headers like Content Security Policy and HSTS
> - Anti-enumeration techniques for authentication
> - Safe error handling that doesn't leak sensitive information
> - Prompt injection protection for AI interactions

> The project uses GitHub Actions for continuous integration, running automated tests and security audits on every push. Dependabot monitors dependencies for vulnerabilities and creates automatic pull requests for updates.

> Currently, the project has zero high or critical vulnerabilities, making it production-ready and secure."

**ACTION**: Show GitHub Actions badge or workflow runs

---

### SCENE 8: Conclusion & Repository (1 minute)

**[SCREEN: Return to application homepage or README]**

**NARRATION**:
> "To summarize, MarketWhisper is a complete AI-powered market intelligence platform that:

> - Automates financial text analysis using advanced AI
> - Detects and tracks multiple companies simultaneously
> - Provides sentiment scores with detailed reasoning
> - Enriches companies with real-time financial data
> - Calculates comprehensive investment scores
> - Offers a modern, secure, and responsive user interface

> The project demonstrates full-stack development skills, AI integration, serverless architecture, and modern DevOps practices.

> You can try the live demo at marketwhisper.vercel.app using the demo credentials shown on the screen. The complete source code is available on GitHub at github.com/IvanAbadLopez/marketwhisper.

> Thank you for watching! If you have any questions, feel free to reach out."

**ACTION**: Show final slide with:
- Live demo URL: https://marketwhisper.vercel.app
- GitHub URL: https://github.com/IvanAbadLopez/marketwhisper
- Demo credentials
- Your contact info

---

## 📌 Example Texts for Demo

### Example 1: Multi-Company (Used in script above)
```
Apple reported strong Q4 earnings with iPhone revenue up 8%, beating analyst 
expectations. The company also announced a $90B share buyback program. Meanwhile, 
Microsoft warned of slowing cloud growth, causing shares to drop 3% in after-hours 
trading. Tesla delivered record vehicles this quarter, with Cybertruck production 
ramping up faster than expected.
```

### Example 2: Single Company (Backup)
```
Amazon Web Services continues to dominate the cloud computing market with a 32% 
market share. The company reported AWS revenue grew 13% year-over-year to $23.5B, 
despite increased competition from Microsoft Azure and Google Cloud. CEO Andy Jassy 
highlighted strong customer adoption of generative AI services on AWS.
```

### Example 3: Bearish Sentiment (Backup)
```
Meta Platforms faces regulatory scrutiny as the EU launches antitrust investigation 
into its advertising practices. Shares fell 5% on the news. Analysts warn that 
potential fines could exceed $1B, impacting profitability. The company's heavy 
investment in the metaverse continues to burn cash with no clear revenue path.
```

---

## 🎯 Recording Tips

### Before Recording:
1. Practice the script 2-3 times to sound natural
2. Time yourself to ensure you're within 10-15 minutes
3. Have water nearby (in case your throat gets dry)
4. Close unnecessary tabs and applications
5. Test audio levels

### During Recording:
1. Speak clearly and at moderate pace (not too fast!)
2. If you make a mistake, pause 3 seconds, then repeat that section
3. Use mouse to highlight important elements on screen
4. Avoid long silences—keep narration flowing
5. Show enthusiasm! Your energy comes through in the video

### After Recording:
1. Review the video for audio/visual quality
2. Edit out mistakes or long pauses (optional but recommended)
3. Add title screen with project name (optional)
4. Add end screen with URLs and contact info
5. Export in 1080p (1920x1080) at 30fps minimum

### Upload Checklist:
- [ ] Video title: "MarketWhisper - AI-Powered Market Intelligence Platform | Master's Thesis Project"
- [ ] Description includes: GitHub link, live demo URL, demo credentials
- [ ] Visibility: Public (or Unlisted if you only want link access)
- [ ] Add to README: link to video

---

## 📤 Suggested Video Description (for YouTube/Drive)

```
MarketWhisper - AI-Powered Market Intelligence Platform

This video presents MarketWhisper, a Master's Thesis project that provides 
AI-powered analysis of financial texts. The platform automatically detects 
companies mentioned in news articles, tweets, and reports, analyzes sentiment, 
and tracks market intelligence over time.

🌐 Live Demo: https://marketwhisper.vercel.app
📦 GitHub Repository: https://github.com/IvanAbadLopez/marketwhisper

Demo Credentials:
Email: demo@marketwhisper.com
Password: MarketWhisper2026!

Tech Stack:
- Next.js 16 + React 19 + TypeScript
- PostgreSQL + Prisma ORM
- Groq API (AI/LLM)
- Finnhub API (Financial Data)
- Vercel + Neon (Serverless Deployment)

Features:
✅ Multi-company detection
✅ AI sentiment analysis (BULLISH/BEARISH/NEUTRAL)
✅ Reliability scoring (1-10)
✅ Real-time financial data enrichment
✅ Global investment score (0-100)
✅ Background job processing
✅ 233 unit tests + E2E tests
✅ Production-grade security

Author: Ivan Abad López
Contact: GitHub @IvanAbadLopez

Timestamps:
0:00 - Introduction
1:00 - Problem & Solution
2:00 - Live Demo: Authentication
3:00 - Live Demo: Text Analysis
6:00 - Live Demo: Company Dashboard
8:00 - Technical Overview
10:00 - Security & Quality
11:00 - Conclusion

#AI #FinTech #NextJS #MachineLearning #SoftwareEngineering #MastersThesis
```

---

## ✅ Final Checklist

Before submitting:
- [ ] Video duration is 10-15 minutes
- [ ] Audio is clear and understandable
- [ ] Screen capture shows full functionality
- [ ] All demo features work correctly
- [ ] Video is uploaded with public access
- [ ] URL is added to README.md
- [ ] URL is added to presentation slides
- [ ] Description includes all relevant links
