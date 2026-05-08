# 🧠 Market Intelligence Engine

> Built for the **Google Cloud Rapid Agent Hackathon** — MongoDB Partner Track

An AI-powered agent that automates end-to-end pre-sales research, lead identification, and personalized outreach — in minutes, not days.

---

## 🚀 What It Does

Give it a **company name** and a **one-line category**. It handles the rest.

The agent researches the company, maps its competitors, identifies the right people to reach, drafts personalized outreach, and tracks engagement — all in a single automated workflow.

---

## 📤 Outputs

| # | Output | Description |
|---|---|---|
| 1 | **Company Overview** | Business model, scale, positioning |
| 2 | **Market Position** | Brand perception & recent shifts |
| 3 | **Competitor Mapping** | 3–5 competitors with strengths & gaps |
| 4 | **Brand Activity** | Campaigns & launches from last 12–24 months |
| 5 | **Experiential Footprint** | Events, activations, outcomes |
| 6 | **Strategic Watchouts** | Risks and blind spots before engaging |
| 7 | **Decision-Maker Identification** | Key stakeholders with role relevance |
| 8 | **Contact Intelligence** | Emails, phone numbers, LinkedIn profiles |
| 9 | **Personalized Outreach** | Tailored LinkedIn message + email draft |
| 10 | **Outreach Tracking** | Engagement logging and response tracking |

---

## 🏗️ Architecture

```
INPUT: Company Name + Category
        ↓
Gemini Agent
  ├── Web Search (research, news, LinkedIn)
  └── Gemini Generation (synthesize + draft)
        ↓
MongoDB MCP Server
  ├── company_profiles
  ├── competitor_map
  ├── brand_activity
  ├── decision_makers
  ├── contact_intelligence
  ├── outreach_drafts
  └── outreach_tracker
        ↓
OUTPUT: Intelligence Report + Outreach + Tracker
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Agent Framework | Google Agent Development Kit (ADK) |
| LLM | Gemini 2.0 Flash |
| MCP Server | MongoDB Atlas (via MongoDB MCP) |
| Web Research | Gemini Grounding + Web Search Tool |
| Outreach Tracking | MongoDB `outreach_tracker` collection |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- MongoDB Atlas account (free tier works)
- Google Cloud project with Gemini API enabled

### Installation

```bash
git clone https://github.com/your-username/market-intelligence-engine
cd market-intelligence-engine
pip install -r requirements.txt
```

### Configuration

```bash
cp .env.example .env
```

Fill in your `.env`:

```
GOOGLE_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=market_intelligence
```

### Run

```bash
python main.py --company "Nike" --category "Athletic footwear and apparel"
```

---

## 🧪 Test Cases

The system is validated across 3 industries with zero reconfiguration:

| Company | Category |
|---|---|
| Nike | Athletic footwear and apparel |
| Notion | Productivity and collaboration software |
| Nykaa | Beauty and personal care e-commerce |

---

## 📁 Project Structure

```
market-intelligence-engine/
├── main.py                  # Entry point
├── agent/
│   ├── researcher.py        # Web search + intelligence gathering
│   ├── lead_finder.py       # Decision-maker identification
│   └── outreach_writer.py   # Personalized message generation
├── mcp/
│   └── mongodb_client.py    # MongoDB MCP integration
├── models/
│   └── schemas.py           # MongoDB collection schemas
├── tracker/
│   └── engagement.py        # Outreach tracking logic
├── requirements.txt
└── .env.example
```

---

## 📊 Outreach Tracking Logic

Every outreach action is logged to MongoDB:

```json
{
  "contact_id": "abc123",
  "company": "Nike",
  "channel": "email",
  "sent_at": "2026-05-08T10:30:00Z",
  "status": "sent",
  "opened_at": null,
  "replied_at": null
}
```

Status progresses: `sent` → `opened` → `replied` → `converted`

---

## 🎯 Why MongoDB?

- **Flexible schema** — works across any industry without reconfiguration
- **Nested documents** — perfect for storing contact cards inside company profiles
- **Atlas free tier** — zero infrastructure cost for the demo
- **MCP-native** — seamless integration with the agent via MongoDB MCP Server

---

## 👤 Author

Built by **[Your Name]** for the Google Cloud Rapid Agent Hackathon — MongoDB Partner Track.

---

## 📄 License

MIT