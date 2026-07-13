# Sales

Bring customer context into the work that moves deals forward.

## When to use this plugin

Use Sales when you need to prepare for customer meetings, follow up after calls, understand account movement, plan deals, build business cases, review forecasts, find customer quotes, coach reps from calls, build competitive guidance, find internal answers, prioritize accounts, enrich company or contact data, or use CRM and Sales Intelligence context.

## Get started

Try asking:

`@Sales Help me get started`

The plugin will help connect the sources the current workflow needs and recommend a useful first workflow.

You can also jump directly into any workflow below.

Sales strongly prefers using the runtime's `ask_user_input` tool for compact workflow choosers, clarification questions, fallback context intake, and review loops. When a selected workflow has a material missing source, Sales first looks for suitable installable providers and uses `request_plugin_install` to offer them before falling back to the plugin page or pasted context. When structured tools are unavailable, Sales falls back to the same choices in text.

## Example workflows

| Workflow | Try this | Skill | Result |
| --- | --- | --- | --- |
| Prepare for a customer meeting | `Prep me for my next customer meeting` | `prepare-for-meeting` | A concise meeting brief with agenda, context, likely blockers, and next actions |
| Follow up after a call | `Turn my latest customer call into a follow-up package` | `follow-up-after-call` | A grounded recap, customer and seller actions, email copy, CRM-ready text, and internal recap draft |
| Analyze account signals | `What changed with Acme in the last two weeks?` | `analyze-account-signals` | An evidence-backed account brief or bounded watchlist summary with recommended actions |
| Plan an active deal | `Build a strategy for the Acme renewal` | `plan-deal-strategy` | A deal map, buying committee, procurement risks, and prioritized next actions |
| Review a forecast | `Review my forecast for risk and next actions` | `review-forecast` | A manager-ready rollup with risk posture, recommendation changes, and evidence gaps |
| Build competitive guidance | `Build a competitive brief for Acme against Competitor Alpha` | `build-competitive-brief` | A source-backed HTML brief with comparison matrix, objection guidance, and caveats |
| Build a business case | `Build a business case for Acme's support automation initiative` | `build-business-case` | A customer-led value story with workflows, assumptions, scenarios, proof, and open questions |
| Find customer quotes | `Find customer quotes about setup friction from recent calls` | `find-customer-quotes` | Verbatim transcript-backed quotes with speaker confidence, provenance, and safe usage notes |
| Coach a rep from calls | `Compare Jamie's discovery calls with strong peer examples` | `get-rep-call-feedback` | Evidence-backed peer exemplars, specific coaching moments, and a practical steal sheet |
| Review rep call trends | `Review Jamie's call trends over the last three months` | `review-rep-call-trends` | Improvement, regression, stable patterns, calls to revisit, and next coaching actions |
| Find internal sources | `Find who owns this security objection and what I should read` | `find-key-internal-sources` | Ranked experts, docs, channels, and a draft-ready first ask |
| Prioritize accounts | `Rank the accounts I should work this week and explain why` | `prioritize-accounts` | A focused account action view with evidence, reachable contacts, and planning-only next steps |
| Enrich account or contact data | `Enrich this account list and flag likely buying teams` | `enrich-company-and-contact-data` | A portable enrichment table for segmentation, ICP-fit review, and outreach planning |
| Use Salesforce context | `Use Salesforce as the CRM source for this account` | `salesforce` | Connector guidance for Salesforce-backed account, opportunity, and contact context |
| Use HubSpot context | `Use HubSpot as the CRM source for this account` | `hubspot` | Connector guidance for HubSpot-backed records, properties, drafts, and approved changes |

## Integrations

Sales can use configured tools when they are available and authorized:

| Source | Supported integrations | What they unlock |
| --- | --- | --- |
| CRM | Salesforce, Agentforce Sales, HubSpot, Close, Zoho, Pipedrive | Account context, opportunity evidence, CRM-ready drafts, and proposed record updates |
| Meeting notes | Zoom, Granola, Fireflies, Otter.ai | Call summaries, transcripts, customer quotes, follow-up context, and coaching evidence |
| Email and messages | Gmail, Outlook Email, Slack, Microsoft Teams, Outreach | Customer follow-up context, internal answer paths, and reviewed draft destinations |
| Documents and calendars | Notion, Google Drive, SharePoint, Google Calendar, Outlook Calendar, Calendly | Account plans, supporting docs, meeting context, and operating cadence |
| Enrichment and signals | ZoomInfo, Clay, HG Insights, Rox, Actively, Apollo, Meticulate | Company and contact enrichment, market signals, ICP discovery, and account prioritization |
| Other context | Monday.com, DocuSign | Optional task-tracker and agreement context when a workflow needs it |

Connected tools provide the smoothest path, but they are not required for every task. You can start with uploaded files, pasted notes, transcripts, exports, spreadsheets, and public research when appropriate. Source setup is lazy: Sales asks to connect only the tools needed for the task at hand.
