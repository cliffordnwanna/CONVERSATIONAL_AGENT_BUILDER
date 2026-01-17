Here's a comprehensive master test prompt to validate your AI Engineering demo:

## 🧪 MASTER TEST PROMPT - AI Agent Builder Demo

### **Test Session 1: Complete User Journey - Knowledge Base Agent**

```
Step 1: Configure Agent
- Use Case: Knowledge Base
- Tone: Professional
- Goal: Provide accurate information from uploaded documents
- Industry: Technology

Step 2: Upload Knowledge
Upload this test document (create a simple .txt file):
---
COMPANY: TechCorp Solutions
FOUNDED: 2020
CEO: Sarah Chen
PRODUCTS: 
- CloudSync Pro (Cloud Storage, $9.99/month)
- DataVault Enterprise (Security Platform, Custom Pricing)
- AI Assistant API (Developer Tool, $0.02/request)

SUPPORT HOURS: 24/7
CONTACT: support@techcorp.example.com
REFUND POLICY: 30-day money-back guarantee on all subscriptions
---

Step 3: Test RAG Functionality
Ask these questions in sequence:

Q1: "Who is the CEO of TechCorp?"
✅ Expected: Should mention Sarah Chen
✅ Should show "🧠 Used Knowledge Base" badge

Q2: "What products does TechCorp offer?"
✅ Expected: Should list CloudSync Pro, DataVault Enterprise, AI Assistant API
✅ Should show pricing information
✅ Should show knowledge usage badge

Q3: "What is your refund policy?"
✅ Expected: Should mention 30-day money-back guarantee
✅ Should show knowledge usage badge
```

### **Test Session 2: Multiple Knowledge Sources**

```
Step 1: Configure Agent
- Use Case: Customer Support
- Tone: Friendly
- Goal: Help customers with product questions

Step 2: Add Multiple Sources
A) Upload File: Product catalog (create .txt):
---
PRODUCT CATALOG 2024
Item A: Widget Pro - $49.99
Item B: Gadget Max - $79.99
Item C: Tool Suite - $99.99
All items include free shipping
---

B) Paste Text:
---
SHIPPING INFORMATION
Standard: 5-7 business days (Free)
Express: 2-3 business days ($15)
Overnight: Next day ($30)
International: 10-15 business days ($25)
---

C) Website URL (if scraping works):
Use any simple documentation page

Step 3: Test Multi-Source RAG
Q1: "How much does Widget Pro cost and how long does shipping take?"
✅ Expected: Should pull from BOTH sources
✅ Should mention $49.99 AND 5-7 days free shipping

Q2: "What are my shipping options?"
✅ Expected: Should list all 4 shipping types with prices

Q3: "Tell me about Gadget Max"
✅ Expected: Should mention $79.99 and free shipping
```

### **Test Session 3: Edge Cases & Limits**

```
Test A: Message Limit
- Send 3 messages
✅ Should block 4th message
✅ Should show "Session limit reached (3 messages)"

Test B: Empty Knowledge Base
- Configure agent but DON'T upload knowledge
- Try to complete configuration
✅ Should NOT allow completion
✅ Should require at least 1 knowledge source

Test C: Knowledge Management
- Upload 3 different files
- Go to "Manage" tab
✅ Should show all 3 sources
✅ Should show word counts
✅ Should show chunk counts (if available)
✅ Should show knowledge IDs
- Delete one source
✅ Should update count immediately

Test D: Configuration Reset
- Complete full configuration
- Click "🔄 Modify Configuration"
✅ Should allow changes
✅ Knowledge should persist
```

### **🔍 Console Log Validation Checklist**

**During File Upload, check for:**
```
✅ 📁 File Upload Success: { filename, knowledgeId, wordCount, chunksCreated }
✅ chunksCreated > 0 (should be ~1 chunk per 500 words)
✅ 📊 Knowledge State Updated: { count, ids }
```

**During Chat, check for:**
```
✅ 📤 Sending Chat Request: { knowledgeIds: [...], knowledgeCount: X }
✅ knowledgeIds array is NOT empty
✅ 🔍 Chat Response Debug: { usedKnowledge: true, chunks: X }
```

**Backend Logs (from your previous document):**
```
✅ 🔍 RAG Search - Total knowledge items: X (should match uploaded count)
✅ 🔍 RAG Search - Found chunks: X (should be > 0)
✅ NOT: "❌ RAG Search - No relevant chunks found"
```

### **🎯 Success Criteria**

**MUST WORK:**
1. ✅ All 4 configuration steps complete
2. ✅ File upload shows chunks created
3. ✅ Knowledge IDs appear in chat requests
4. ✅ RAG finds relevant chunks (backend logs)
5. ✅ AI responses use knowledge base content
6. ✅ "🧠 Used Knowledge Base" badge appears
7. ✅ Multiple knowledge sources work together
8. ✅ 3-message limit enforced
9. ✅ Configuration requires knowledge upload
10. ✅ All CRUD operations work (Create, Read, Update, Delete knowledge)

**NICE TO HAVE:**
- Website scraping works
- Text paste creates chunks
- Analytics track knowledge usage
- Session persistence across page refresh

### **❌ Critical Failures (Must Fix Before Demo)**

If ANY of these occur, DO NOT proceed:
1. ❌ Knowledge uploaded but chunks = 0
2. ❌ Chat request shows knowledgeIds: undefined
3. ❌ Backend logs: "Found chunks: 0" 
4. ❌ AI never uses knowledge (no badge appears)
5. ❌ TypeScript errors in console
6. ❌ Upload fails silently

---

**Run this entire test suite** and document results. Only proceed with the demo when all ✅ criteria are met!