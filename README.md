# Langboard

Langboard is an **AI Agent Orchestration Platform** that empowers organizations to build, manage, and monitor multi-agent workflows with **human-in-the-loop (HITL) controls**.
Unlike traditional automation tools or fully autonomous agent experiments (e.g., AutoGPT, BabyAGI), Langboard strikes the balance between **AI autonomy** and **human governance**, ensuring safe, scalable, and enterprise-ready AI orchestration.

---

## 🌍 Vision and Purpose

AI systems are powerful, but not infallible. Even state-of-the-art large language models (LLMs) hallucinate, misinterpret context, or act unpredictably. Langboard was created with a simple principle:

> **“AI should act, but humans must approve.”**

Langboard’s mission is to enable enterprises to harness AI efficiency without sacrificing reliability, compliance, or accountability.

---

## 🚀 Quick Start

- For Windows users

  - You can run one of `quickstart.ps1`, `quickstart-ollama-cpu.ps1`, and `quickstart-ollama-gpu.ps1` in `scripts` directory with powershell
    - If the system opens Notepad when you double-click the files, you should select 'Run with powershell' by right-click menu.
  - You can run powershell scripts below

  ```powershell
  cd .\scripts
  .\quickstart.ps1    REM default
  .\quickstart-ollama-cpu.ps1   REM if you want CPU mode
  .\quickstart-ollama-gpu.ps1   REM if you want GPU mode
  ```

- For other OS users,

  - You can double-click one of `quickstart.sh`, `quickstart-ollama-cpu.sh`, and `quickstart-ollama-gpu.sh` in `scripts` directory
  - You can run bash scripts below

  ```bash
  cd ./scripts
  ./quickstart.sh              # default
  ./quickstart-ollama-cpu.sh   # if you want CPU mode
  ./quickstart-ollama-gpu.sh   # if you want GPU mode
  ```

## ✨ Core Features

1. **Kanban Board Interface**

   - Inspired by Trello, Langboard visualizes workflows as columns (stages) and cards (tasks).
   - Each card represents an AI-driven process, with real-time status updates.
   - Intuitive UX allows non-technical teams to manage complex AI pipelines.

2. **Multi-Agent Collaboration**

   - Multiple specialized AI agents work together as a team.
   - Example: a **Content Writer Agent** drafts text → a **Design Agent** generates images → final output is submitted to a **Human Approver**.
   - Supports delegation, task splitting, and cooperative workflows.

3. **Human-in-the-Loop (Reaction Approval)**

   - Critical actions pause until a human approves.
   - Example: before writing to an internal database or calling an external API, Langboard shows a “Pending Approval” card.
   - Human approvers can **approve** or **reject** with a single click.

4. **LangGraph & LangChain Orchestration**

   - Built on LangChain with planned integration of LangGraph for **stateful, interruptible workflows**.
   - Each Kanban column can map to a LangGraph node, supporting branching, conditional flows, and long-running processes.

5. **Observability & Monitoring**

   - All agent actions are logged and visualized.
   - Prompts, responses, and tool calls are traceable via Langfuse-style dashboards.
   - Enhances debugging, compliance, and reliability.

6. **Retrieval-Augmented Generation (RAG) Search**

   - Embeds task data into vector databases for semantic retrieval.
   - Allows context-rich search across ongoing and past tasks.

7. **Customizable AI Agents**

   - Modular “Template Agents” (nicknamed _Mon_) can be plugged into workflows.
   - Supports domain-specific AI customization (finance, healthcare, legal, etc.).

---

## 🏗️ Architecture

- **Frontend:** Kanban-style board, real-time collaboration.
- **Backend:** Langboard Orchestrator → LangGraph (planned) → LangChain / LangFlow / external AI tools.
- **Human-in-the-loop:** Interrupt gates at predefined workflow steps.
- **Integrations:** External APIs, vector databases, and custom tools.
- **Deployment:** SaaS, On-premises (VPC), or Full On-premises with network isolation.

---

## 🆚 Differentiation

- **vs Palantir**: Langboard is not a closed black-box platform for governments/enterprises. It’s modular, source-available, and customizable for any organization.
- **vs DeepAuto**: DeepAuto focuses on full automation (Query Router, LongContext AI). Langboard emphasizes human approval and governance.
- **vs LangChain (library)**: Langboard provides a **UI-driven orchestration layer** with Kanban visualization and collaboration.
- **vs Flowise / LangFlow (open-source UI)**: These tools are great for prototyping, but lack enterprise features such as RBAC, audit logs, SSO, and approval gates. Langboard extends them into a production-grade solution.

---

## 📜 License

Langboard is distributed under a **source-available license inspired by Elastic License v2**.

- ✅ Internal use: free and unlimited.
- ❌ No SaaS resale: cannot be offered as a hosted service without a commercial license.
- ⚖️ Commercial license required: for SaaS, resale, or bundled enterprise products.
- 🌐 GitHub Sponsors supported: sponsorship is voluntary support, not a substitute for a license.

> **Special Clause (valid until April 30, 2025):**
> Organizations subscribing to the **lowest-tier paid plan via GitHub Sponsors** before April 30, 2025, are eligible for a **3-year fixed-price commercial license** at the current plan rate, protected against future price increases.

See [LICENSE](./LICENSE) for full details.

---

## 🤝 Contributing

Contributions are welcome!

- Fork the repo and submit pull requests.
- Report issues and request features.
- Participate in discussions and share workflow templates.

Please follow our [contribution guidelines](./CONTRIBUTING.md).

---

## ❤️ Sponsorship

Langboard development is sustained through **GitHub Sponsors**.
If you find Langboard valuable, please consider supporting us:

👉 [Sponsor Langboard on GitHub](https://github.com/sponsors/yamonco)

Sponsors may receive acknowledgments, early previews, or priority feedback opportunities.

---

## 📧 Contact

For **commercial license inquiries**, **enterprise deployment**, or **partnerships**, please reach out to:

📩 [yamon@yamon.io](mailto:yamon@yamon.io)

---

🔥 With Langboard, you get the **efficiency of AI agents + the reliability of human governance** — all in one orchestration platform.

---

Would you like me to **package this README with LICENSE.md** into a polished GitHub repo starter (ready-to-push format)? That way you can drop it directly into your Langboard repository.
