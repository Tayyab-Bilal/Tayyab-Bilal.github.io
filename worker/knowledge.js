// Public facts about Tayyab. Everything here becomes public through Bolt. Edit by line, then redeploy.
// Each line is [topic, fact]. Topics: about, career, work, skills, approach, writing, education, practical.
// One short plain sentence per fact, third person. Bolt picks the best matches for each question.
export const KNOWLEDGE = [
  // about
  ["about", "Tayyab Bilal is an AI engineer who builds agents and AI products."],
  ["about", "He is currently a Senior AI Engineer at SWSAM Solutions."],
  ["about", "He has 5 years of experience in machine learning and AI, and about 4 of those years went into building agents."],
  ["about", "He is based in Lahore, Pakistan, on Pakistan Standard Time."],
  ["about", "He speaks English and Urdu."],
  ["about", "His current research interest is AI security, meaning how to keep AI agents from doing things they should not."],
  ["about", "He built this site and Bolt, the little robot pet that answers questions on it."],

  // career
  ["career", "His career so far is Quid Sol, then TransData, then SWSAM Solutions."],
  ["career", "At Quid Sol he worked as a Machine Learning Engineer from February 2022 to September 2024."],
  ["career", "At TransData he worked as a Senior Machine Learning Engineer from November 2024 to April 2026."],
  ["career", "At SWSAM Solutions he has worked as a Senior AI Engineer since April 2026."],
  ["career", "His agent work grew in steps: Rasa state machines first, then hand written ReAct loops, then LangGraph."],

  // work: Quid Sol
  ["work", "At Quid Sol he built machine learning apps and chatbots for clients in healthcare, e-commerce, fintech and customer service."],
  ["work", "At Quid Sol he built chatbots on Rasa, where the conversation flow is a hand designed state machine."],
  ["work", "At Quid Sol he wrote ReAct style agents by hand in plain Python while loops, before agent frameworks were common."],
  ["work", "At Quid Sol he also built computer vision tools, recommendation systems and document parsing with OCR."],
  ["work", "At Quid Sol he built the backend services around his models with FastAPI."],

  // work: TransData
  ["work", "At TransData he rebuilt a monolithic agent prototype as microservices with deploys that cause no downtime."],
  ["work", "At TransData he built a conversational AI platform on AWS Bedrock and Azure OpenAI, with MCP connectors for tools like Slack and Box."],
  ["work", "At TransData he cut inference cost by about 80% by serving a Qwen 7B model in 4 bit with QLoRA."],
  ["work", "At TransData he built a question clustering system that saved the team 15 to 20 hours a week."],
  ["work", "At TransData he built agent workflows with LangGraph and wrote MCP patterns that made new tools quick to add."],
  ["work", "At TransData he built RAG pipelines with hybrid search, reranking and vector databases."],

  // work: SWSAM
  ["work", "SWSAM Solutions builds an AI workspace platform for a Middle Eastern client, and Tayyab works on its AI side."],
  ["work", "At SWSAM he led a team of engineers."],
  ["work", "At SWSAM he built an autonomous agent with a planner and an executor that carries out tasks for users on a schedule."],
  ["work", "At SWSAM he designed Guardian, a permission layer for AI actions where the model proposes and code decides."],
  ["work", "Guardian denies by default, so any action the rules do not clearly allow waits for a human to approve it."],
  ["work", "At SWSAM he built a discovery agent that uses the ReAct pattern and calls many retrieval tools in parallel."],
  ["work", "At SWSAM he chose grep first retrieval over a vector database for agent search, because it is cheaper, faster and always fresh."],
  ["work", "At SWSAM he built an AI cost and token tracker, with a build time guard that stops code from skipping it."],
  ["work", "At SWSAM he cut planning cost by about 77% by moving the planner to a different model, with every test still passing."],
  ["work", "At SWSAM he set up the CI pipeline from scratch."],
  ["work", "At SWSAM he does security focused code review and has caught serious bugs, like users being able to act as other users."],
  ["work", "At SWSAM he built and tested an agent kit for building specialist agents."],
  ["work", "At SWSAM he built and tested a workflow builder agent and a workflow doctor agent that finds and fixes broken workflows."],
  ["work", "At SWSAM he fixed the gaps found in a production readiness audit of the AI service."],

  // skills
  ["skills", "His main language is Python."],
  ["skills", "For agents he uses LangGraph, LangChain and MCP, the Model Context Protocol."],
  ["skills", "He works with vector databases and other search tools, including FAISS, Milvus and Qdrant."],
  ["skills", "He has worked with model providers including Anthropic, OpenAI, Azure OpenAI and AWS Bedrock."],
  ["skills", "On the backend he uses FastAPI, Celery, PostgreSQL, Redis and Docker."],
  ["skills", "He has deployed on AWS, Azure and Google Cloud."],
  ["skills", "He writes evals to measure whether AI features actually work."],

  // approach
  ["approach", "He writes a design doc before he builds a big feature."],
  ["approach", "He tests his agents by attacking them on purpose, using adversarial test suites, before real users meet them."],
  ["approach", "He pays close attention to cost, and tracks what every AI call costs."],
  ["approach", "He believes an AI agent should not decide for itself what it is allowed to do, so code makes that call."],

  // writing
  ["writing", "He writes a blog on this site, with two articles so far."],
  ["writing", "One article is called Everyone's first answer is a vector database. Mine was grep."],
  ["writing", "Another article is called I didn't give my agent a code sandbox, and it explains why a SQLite authorizer was safer."],
  ["writing", "In the sandbox article, the SQLite authorizer only allows reads, so the database itself refuses writes."],

  // education
  ["education", "He studied Computer Science at University of Central Punjab in Lahore, and his degree is a BS earned from 2017 to 2021."],
  ["education", "In 2026 he earned 8 Anthropic certifications, including Claude API, Amazon Bedrock, MCP, Claude Code, subagents and agent skills."],

  // practical
  ["practical", "If you want to know whether he is available, open to hire, or what his rates are, ask him directly by email at tayyaib055766@gmail.com or on LinkedIn at linkedin.com/in/tayyab-bilal-tdev."],
  ["practical", "Tayyab's email is tayyaib055766@gmail.com and his LinkedIn is linkedin.com/in/tayyab-bilal-tdev."],
  ["practical", "His CV can be downloaded from the Download CV button at the top of this site."]
];
