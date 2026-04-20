# Agents

[← Back to README](../README.md)

This reference covers every agent persona available in the repository, organized by category. Each agent is a specialized AI model configuration loaded from `shared/.ai-agents/agents/`.

## How agents work

Each agent is defined by a Markdown file with YAML frontmatter. The frontmatter may override the default model (`model:`), reasoning depth (`thinkingLevel:`), and available tools (`tools:`). When no overrides are present the host application's defaults apply.

**Invoking an agent:**

- **Inline `@mention`** — type `@agent-name` anywhere in a prompt to route that turn to the specified agent.
- **`/agents` command** — open the agents picker in the host UI, select an agent, and every subsequent message in that session is handled by it.

---

## 00 · General

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| communication-excellence-coach | PROACTIVELY use when reviewing communication drafts or preparing difficult conversations. Provides email refinement, tone calibration, roleplay practice, and presentation feedback with actionable suggestions. | `@communication-excellence-coach` |
| general-purpose | Default agent for handling complex, multi-step tasks with automatic delegation capabilities | `@general-purpose` |

---

## 01 · Core

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| api-designer | API architecture expert designing scalable, developer-friendly interfaces. Creates REST and GraphQL APIs with comprehensive documentation, focusing on consistency, performance, and developer experience. | `@api-designer` |
| backend-developer | Senior backend engineer specializing in scalable API development and microservices architecture. Builds robust server-side solutions with focus on performance, security, and maintainability. | `@backend-developer` |
| fullstack-developer | End-to-end feature owner with expertise across the entire stack. Delivers complete solutions from database to UI with focus on seamless integration and optimal user experience. | `@fullstack-developer` |
| graphql-architect | GraphQL schema architect designing efficient, scalable API graphs. Masters federation, subscriptions, and query optimization while ensuring type safety and developer experience. | `@graphql-architect` |
| microservices-architect | Distributed systems architect designing scalable microservice ecosystems. Masters service boundaries, communication patterns, and operational excellence in cloud-native environments. | `@microservices-architect` |
| websocket-engineer | Real-time communication specialist implementing scalable WebSocket architectures. Masters bidirectional protocols, event-driven systems, and low-latency messaging for interactive applications. | `@websocket-engineer` |

---

## 02 · Languages

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| angular-architect | Expert Angular architect mastering Angular 15+ with enterprise patterns. Specializes in RxJS, NgRx state management, micro-frontend architecture, and performance optimization with focus on building scalable enterprise applications. | `@angular-architect` |
| golang-pro | Expert Go developer specializing in high-performance systems, concurrent programming, and cloud-native microservices. Masters idiomatic Go patterns with emphasis on simplicity, efficiency, and reliability. | `@golang-pro` |
| java-architect | Senior Java architect specializing in enterprise-grade applications, Spring ecosystem, and cloud-native development. Masters modern Java features, reactive programming, and microservices patterns with focus on scalability and maintainability. | `@java-architect` |
| javascript-pro | Expert JavaScript developer specializing in modern ES2023+ features, asynchronous programming, and full-stack development. Masters both browser APIs and Node.js ecosystem with emphasis on performance and clean code patterns. | `@javascript-pro` |
| laravel-specialist | Expert Laravel specialist mastering Laravel 10+ with modern PHP practices. Specializes in elegant syntax, Eloquent ORM, queue systems, and enterprise features with focus on building scalable web applications and APIs. | `@laravel-specialist` |
| lua-pro | Senior Lua developer with deep expertise in Lua and its ecosystem, specializing in building efficient, concurrent, and scalable Lua plugins, game scripting, embedded systems, and high-performance applications. | `@lua-pro` |
| nextjs-developer | Expert Next.js developer mastering Next.js 14+ with App Router and full-stack features. Specializes in server components, server actions, performance optimization, and production deployment with focus on building fast, SEO-friendly applications. | `@nextjs-developer` |
| php-pro | Expert PHP developer specializing in modern PHP 8.3+ with strong typing, async programming, and enterprise frameworks. Masters Laravel, Symfony, and modern PHP patterns with emphasis on performance and clean architecture. | `@php-pro` |
| python-pro | Expert Python developer specializing in modern Python 3.11+ development with deep expertise in type safety, async programming, data science, and web frameworks. Masters Pythonic patterns while ensuring production-ready code quality. | `@python-pro` |
| rails-expert | Expert Rails specialist mastering Rails 7+ with modern conventions. Specializes in convention over configuration, Hotwire/Turbo, Action Cable, and rapid application development with focus on building elegant, maintainable web applications. | `@rails-expert` |
| react-specialist | Expert React specialist mastering React 18+ with modern patterns and ecosystem. Specializes in performance optimization, advanced hooks, server components, and production-ready architectures with focus on creating scalable, maintainable applications. | `@react-specialist` |
| rust-engineer | Expert Rust developer specializing in systems programming, memory safety, and zero-cost abstractions. Masters ownership patterns, async programming, and performance optimization for mission-critical applications. | `@rust-engineer` |
| spring-boot-engineer | Expert Spring Boot engineer mastering Spring Boot 3+ with cloud-native patterns. Specializes in microservices, reactive programming, Spring Cloud integration, and enterprise solutions with focus on building scalable, production-ready applications. | `@spring-boot-engineer` |
| sql-pro | Expert SQL developer specializing in complex query optimization, database design, and performance tuning across PostgreSQL, MySQL, SQL Server, and Oracle. Masters advanced SQL features, indexing strategies, and data warehousing patterns. | `@sql-pro` |
| typescript-pro | Expert TypeScript developer specializing in advanced type system usage, full-stack development, and build optimization. Masters type-safe patterns for both frontend and backend with emphasis on developer experience and runtime safety. | `@typescript-pro` |
| vue-expert | Expert Vue specialist mastering Vue 3 with Composition API and ecosystem. Specializes in reactivity system, performance optimization, Nuxt 3 development, and enterprise patterns with focus on building elegant, reactive applications. | `@vue-expert` |

---

## 03 · Infrastructure

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| cloud-architect | Expert cloud architect specializing in multi-cloud strategies, scalable architectures, and cost-effective solutions. Masters AWS, Azure, and GCP with focus on security, performance, and compliance while designing resilient cloud-native systems. | `@cloud-architect` |
| database-administrator | Expert database administrator specializing in high-availability systems, performance optimization, and disaster recovery. Masters PostgreSQL, MySQL, MongoDB, and Redis with focus on reliability, scalability, and operational excellence. | `@database-administrator` |
| deployment-engineer | Expert deployment engineer specializing in CI/CD pipelines, release automation, and deployment strategies. Masters blue-green, canary, and rolling deployments with focus on zero-downtime releases and rapid rollback capabilities. | `@deployment-engineer` |
| devops-engineer | Expert DevOps engineer bridging development and operations with comprehensive automation, monitoring, and infrastructure management. Masters CI/CD, containerization, and cloud platforms with focus on culture, collaboration, and continuous improvement. | `@devops-engineer` |
| devops-incident-responder | Expert incident responder specializing in rapid detection, diagnosis, and resolution of production issues. Masters observability tools, root cause analysis, and automated remediation with focus on minimizing downtime and preventing recurrence. | `@devops-incident-responder` |
| incident-responder | Expert incident responder specializing in security and operational incident management. Masters evidence collection, forensic analysis, and coordinated response with focus on minimizing impact and preventing future incidents. | `@incident-responder` |
| kubernetes-specialist | Expert Kubernetes specialist mastering container orchestration, cluster management, and cloud-native architectures. Specializes in production-grade deployments, security hardening, and performance optimization with focus on scalability and reliability. | `@kubernetes-specialist` |
| network-engineer | Expert network engineer specializing in cloud and hybrid network architectures, security, and performance optimization. Masters network design, troubleshooting, and automation with focus on reliability, scalability, and zero-trust principles. | `@network-engineer` |
| platform-engineer | Expert platform engineer specializing in internal developer platforms, self-service infrastructure, and developer experience. Masters platform APIs, GitOps workflows, and golden path templates with focus on empowering developers and accelerating delivery. | `@platform-engineer` |
| security-engineer | Expert infrastructure security engineer specializing in DevSecOps, cloud security, and compliance frameworks. Masters security automation, vulnerability management, and zero-trust architecture with emphasis on shift-left security practices. | `@security-engineer` |
| sre-engineer | Expert Site Reliability Engineer balancing feature velocity with system stability through SLOs, automation, and operational excellence. Masters reliability engineering, chaos testing, and toil reduction with focus on building resilient, self-healing systems. | `@sre-engineer` |
| terraform-engineer | Expert Terraform engineer specializing in infrastructure as code, multi-cloud provisioning, and modular architecture. Masters Terraform best practices, state management, and enterprise patterns with focus on reusability, security, and automation. | `@terraform-engineer` |

---

## 04 · Quality and Security

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| accessibility-tester | Expert accessibility tester specializing in WCAG compliance, inclusive design, and universal access. Masters screen reader compatibility, keyboard navigation, and assistive technology integration with focus on creating barrier-free digital experiences. | `@accessibility-tester` |
| architect-reviewer | Expert architecture reviewer specializing in system design validation, architectural patterns, and technical decision assessment. Masters scalability analysis, technology stack evaluation, and evolutionary architecture with focus on maintainability and long-term viability. | `@architect-reviewer` |
| chaos-engineer | Expert chaos engineer specializing in controlled failure injection, resilience testing, and building antifragile systems. Masters chaos experiments, game day planning, and continuous resilience improvement with focus on learning from failure. | `@chaos-engineer` |
| code-reviewer | Expert code reviewer specializing in code quality, security vulnerabilities, and best practices across multiple languages. Masters static analysis, design patterns, and performance optimization with focus on maintainability and technical debt reduction. | `@code-reviewer` |
| compliance-auditor | Expert compliance auditor specializing in regulatory frameworks, data privacy laws, and security standards. Masters GDPR, HIPAA, PCI DSS, SOC 2, and ISO certifications with focus on automated compliance validation and continuous monitoring. | `@compliance-auditor` |
| debugger | Expert debugger specializing in complex issue diagnosis, root cause analysis, and systematic problem-solving. Masters debugging tools, techniques, and methodologies across multiple languages and environments with focus on efficient issue resolution. | `@debugger` |
| error-detective | Expert error detective specializing in complex error pattern analysis, correlation, and root cause discovery. Masters distributed system debugging, error tracking, and anomaly detection with focus on finding hidden connections and preventing error cascades. | `@error-detective` |
| penetration-tester | Expert penetration tester specializing in ethical hacking, vulnerability assessment, and security testing. Masters offensive security techniques, exploit development, and comprehensive security assessments with focus on identifying and validating security weaknesses. | `@penetration-tester` |
| performance-engineer | Expert performance engineer specializing in system optimization, bottleneck identification, and scalability engineering. Masters performance testing, profiling, and tuning across applications, databases, and infrastructure with focus on achieving optimal response times and resource efficiency. | `@performance-engineer` |
| qa-expert | Expert QA engineer specializing in comprehensive quality assurance, test strategy, and quality metrics. Masters manual and automated testing, test planning, and quality processes with focus on delivering high-quality software through systematic testing. | `@qa-expert` |
| security-auditor | Expert security auditor specializing in comprehensive security assessments, compliance validation, and risk management. Masters security frameworks, audit methodologies, and compliance standards with focus on identifying vulnerabilities and ensuring regulatory adherence. | `@security-auditor` |
| test-automator | Expert test automation engineer specializing in building robust test frameworks, CI/CD integration, and comprehensive test coverage. Masters multiple automation tools and frameworks with focus on maintainable, scalable, and efficient automated testing solutions. | `@test-automator` |

---

## 05 · Data and AI

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| ai-engineer | Expert AI engineer specializing in AI system design, model implementation, and production deployment. Masters multiple AI frameworks and tools with focus on building scalable, efficient, and ethical AI solutions from research to production. | `@ai-engineer` |
| data-analyst | Expert data analyst specializing in business intelligence, data visualization, and statistical analysis. Masters SQL, Python, and BI tools to transform raw data into actionable insights with focus on stakeholder communication and business impact. | `@data-analyst` |
| data-engineer | Expert data engineer specializing in building scalable data pipelines, ETL/ELT processes, and data infrastructure. Masters big data technologies and cloud platforms with focus on reliable, efficient, and cost-optimized data platforms. | `@data-engineer` |
| data-scientist | Expert data scientist specializing in statistical analysis, machine learning, and business insights. Masters exploratory data analysis, predictive modeling, and data storytelling with focus on delivering actionable insights that drive business value. | `@data-scientist` |
| database-optimizer | Expert database optimizer specializing in query optimization, performance tuning, and scalability across multiple database systems. Masters execution plan analysis, index strategies, and system-level optimizations with focus on achieving peak database performance. | `@database-optimizer` |
| llm-architect | Expert LLM architect specializing in large language model architecture, deployment, and optimization. Masters LLM system design, fine-tuning strategies, and production serving with focus on building scalable, efficient, and safe LLM applications. | `@llm-architect` |
| machine-learning-engineer | Expert ML engineer specializing in production model deployment, serving infrastructure, and scalable ML systems. Masters model optimization, real-time inference, and edge deployment with focus on reliability and performance at scale. | `@machine-learning-engineer` |
| ml-engineer | Expert ML engineer specializing in machine learning model lifecycle, production deployment, and ML system optimization. Masters both traditional ML and deep learning with focus on building scalable, reliable ML systems from training to serving. | `@ml-engineer` |
| mlops-engineer | Expert MLOps engineer specializing in ML infrastructure, platform engineering, and operational excellence for machine learning systems. Masters CI/CD for ML, model versioning, and scalable ML platforms with focus on reliability and automation. | `@mlops-engineer` |
| nlp-engineer | Expert NLP engineer specializing in natural language processing, understanding, and generation. Masters transformer models, text processing pipelines, and production NLP systems with focus on multilingual support and real-time performance. | `@nlp-engineer` |
| postgres-pro | Expert PostgreSQL specialist mastering database administration, performance optimization, and high availability. Deep expertise in PostgreSQL internals, advanced features, and enterprise deployment with focus on reliability and peak performance. | `@postgres-pro` |
| prompt-engineer | Expert prompt engineer specializing in designing, optimizing, and managing prompts for large language models. Masters prompt architecture, evaluation frameworks, and production prompt systems with focus on reliability, efficiency, and measurable outcomes. | `@prompt-engineer` |

---

## 06 · Developer Experience

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| build-engineer | Expert build engineer specializing in build system optimization, compilation strategies, and developer productivity. Masters modern build tools, caching mechanisms, and creating fast, reliable build pipelines that scale with team growth. | `@build-engineer` |
| cli-developer | Expert CLI developer specializing in command-line interface design, developer tools, and terminal applications. Masters user experience, cross-platform compatibility, and building efficient CLI tools that developers love to use. | `@cli-developer` |
| dependency-manager | Expert dependency manager specializing in package management, security auditing, and version conflict resolution across multiple ecosystems. Masters dependency optimization, supply chain security, and automated updates with focus on maintaining stable, secure, and efficient dependency trees. | `@dependency-manager` |
| documentation-engineer | Expert documentation engineer specializing in technical documentation systems, API documentation, and developer-friendly content. Masters documentation-as-code, automated generation, and creating maintainable documentation that developers actually use. | `@documentation-engineer` |
| dx-optimizer | Expert developer experience optimizer specializing in build performance, tooling efficiency, and workflow automation. Masters development environment optimization with focus on reducing friction, accelerating feedback loops, and maximizing developer productivity and satisfaction. | `@dx-optimizer` |
| git-workflow-manager | Expert Git workflow manager specializing in branching strategies, automation, and team collaboration. Masters Git workflows, merge conflict resolution, and repository management with focus on enabling efficient, clear, and scalable version control practices. | `@git-workflow-manager` |
| legacy-modernizer | Expert legacy system modernizer specializing in incremental migration strategies and risk-free modernization. Masters refactoring patterns, technology updates, and business continuity with focus on transforming legacy systems into modern, maintainable architectures without disrupting operations. | `@legacy-modernizer` |
| mcp-developer | Expert MCP developer specializing in Model Context Protocol server and client development. Masters protocol specification, SDK implementation, and building production-ready integrations between AI systems and external tools/data sources. | `@mcp-developer` |
| mermaid-diagram-specialist | Mermaid diagram specialist for creating flowcharts, sequence diagrams, ERDs, and architecture visualizations. | `@mermaid-diagram-specialist` |
| refactoring-specialist | Expert refactoring specialist mastering safe code transformation techniques and design pattern application. Specializes in improving code structure, reducing complexity, and enhancing maintainability while preserving behavior with focus on systematic, test-driven refactoring. | `@refactoring-specialist` |
| tooling-engineer | Expert tooling engineer specializing in developer tool creation, CLI development, and productivity enhancement. Masters tool architecture, plugin systems, and user experience design with focus on building efficient, extensible tools that significantly improve developer workflows. | `@tooling-engineer` |

---

## 07 · Specialized Domains

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| api-documenter | Expert API documenter specializing in creating comprehensive, developer-friendly API documentation. Masters OpenAPI/Swagger specifications, interactive documentation portals, and documentation automation with focus on clarity, completeness, and exceptional developer experience. | `@api-documenter` |
| blockchain-developer | Expert blockchain developer specializing in smart contract development, DApp architecture, and DeFi protocols. Masters Solidity, Web3 integration, and blockchain security with focus on building secure, gas-efficient, and innovative decentralized applications. | `@blockchain-developer` |
| fintech-engineer | Expert fintech engineer specializing in financial systems, regulatory compliance, and secure transaction processing. Masters banking integrations, payment systems, and building scalable financial technology that meets stringent regulatory requirements. | `@fintech-engineer` |
| music-agent | Expert music agent specializing in music library analysis, ID3 tag extraction, and playlist generation. Masters audio feature analysis and mood-based classification to create curated music experiences. | `@music-agent` |
| payment-integration | Expert payment integration specialist mastering payment gateway integration, PCI compliance, and financial transaction processing. Specializes in secure payment flows, multi-currency support, and fraud prevention with focus on reliability, compliance, and seamless user experience. | `@payment-integration` |
| quant-analyst | Expert quantitative analyst specializing in financial modeling, algorithmic trading, and risk analytics. Masters statistical methods, derivatives pricing, and high-frequency trading with focus on mathematical rigor, performance optimization, and profitable strategy development. | `@quant-analyst` |
| risk-manager | Expert risk manager specializing in comprehensive risk assessment, mitigation strategies, and compliance frameworks. Masters risk modeling, stress testing, and regulatory compliance with focus on protecting organizations from financial, operational, and strategic risks. | `@risk-manager` |

---

## 08 · Business and Product

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| business-analyst | Expert business analyst specializing in requirements gathering, process improvement, and data-driven decision making. Masters stakeholder management, business process modeling, and solution design with focus on delivering measurable business value. | `@business-analyst` |
| content-marketer | Expert content marketer specializing in content strategy, SEO optimization, and engagement-driven marketing. Masters multi-channel content creation, analytics, and conversion optimization with focus on building brand authority and driving measurable business results. | `@content-marketer` |
| customer-success-manager | Expert customer success manager specializing in customer retention, growth, and advocacy. Masters account health monitoring, strategic relationship building, and driving customer value realization to maximize satisfaction and revenue growth. | `@customer-success-manager` |
| legal-advisor | Expert legal advisor specializing in technology law, compliance, and risk mitigation. Masters contract drafting, intellectual property, data privacy, and regulatory compliance with focus on protecting business interests while enabling innovation and growth. | `@legal-advisor` |
| product-manager | Expert product manager specializing in product strategy, user-centric development, and business outcomes. Masters roadmap planning, feature prioritization, and cross-functional leadership with focus on delivering products that users love and drive business growth. | `@product-manager` |
| project-manager | Expert project manager specializing in project planning, execution, and delivery. Masters resource management, risk mitigation, and stakeholder communication with focus on delivering projects on time, within budget, and exceeding expectations. | `@project-manager` |
| sales-engineer | Expert sales engineer specializing in technical pre-sales, solution architecture, and proof of concepts. Masters technical demonstrations, competitive positioning, and translating complex technology into business value for prospects and customers. | `@sales-engineer` |
| scrum-master | Expert Scrum Master specializing in agile transformation, team facilitation, and continuous improvement. Masters Scrum framework implementation, impediment removal, and fostering high-performing, self-organizing teams that deliver value consistently. | `@scrum-master` |
| technical-writer | Expert technical writer specializing in clear, accurate documentation and content creation. Masters API documentation, user guides, and technical content with focus on making complex information accessible and actionable for diverse audiences. | `@technical-writer` |
| ux-researcher | Expert UX researcher specializing in user insights, usability testing, and data-driven design decisions. Masters qualitative and quantitative research methods to uncover user needs, validate designs, and drive product improvements through actionable insights. | `@ux-researcher` |

---

## 09 · Meta-Orchestration

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| agent-organizer | Expert agent organizer specializing in multi-agent orchestration, team assembly, and workflow optimization. Masters task decomposition, agent selection, and coordination strategies with focus on achieving optimal team performance and resource utilization. | `@agent-organizer` |
| context-manager | Expert context manager specializing in information storage, retrieval, and synchronization across multi-agent systems. Masters state management, version control, and data lifecycle with focus on ensuring consistency, accessibility, and performance at scale. | `@context-manager` |
| error-coordinator | Expert error coordinator specializing in distributed error handling, failure recovery, and system resilience. Masters error correlation, cascade prevention, and automated recovery strategies across multi-agent systems with focus on minimizing impact and learning from failures. | `@error-coordinator` |
| knowledge-synthesizer | Expert knowledge synthesizer specializing in extracting insights from multi-agent interactions, identifying patterns, and building collective intelligence. Masters cross-agent learning, best practice extraction, and continuous system improvement through knowledge management. | `@knowledge-synthesizer` |
| multi-agent-coordinator | Expert multi-agent coordinator specializing in complex workflow orchestration, inter-agent communication, and distributed system coordination. Masters parallel execution, dependency management, and fault tolerance with focus on achieving seamless collaboration at scale. | `@multi-agent-coordinator` |
| performance-monitor | Expert performance monitor specializing in system-wide metrics collection, analysis, and optimization. Masters real-time monitoring, anomaly detection, and performance insights across distributed agent systems with focus on observability and continuous improvement. | `@performance-monitor` |
| task-distributor | Expert task distributor specializing in intelligent work allocation, load balancing, and queue management. Masters priority scheduling, capacity tracking, and fair distribution with focus on maximizing throughput while maintaining quality and meeting deadlines. | `@task-distributor` |
| workflow-orchestrator | Expert workflow orchestrator specializing in complex process design, state machine implementation, and business process automation. Masters workflow patterns, error compensation, and transaction management with focus on building reliable, flexible, and observable workflow systems. | `@workflow-orchestrator` |

---

## 10 · Curiosity

| Agent | Description | Invoke with |
|-------|-------------|-------------|
| competitive-analyst | Expert competitive analyst specializing in competitor intelligence, strategic analysis, and market positioning. Masters competitive benchmarking, SWOT analysis, and strategic recommendations with focus on creating sustainable competitive advantages. | `@competitive-analyst` |
| data-researcher | Expert data researcher specializing in discovering, collecting, and analyzing diverse data sources. Masters data mining, statistical analysis, and pattern recognition with focus on extracting meaningful insights from complex datasets to support evidence-based decisions. | `@data-researcher` |
| market-researcher | Expert market researcher specializing in market analysis, consumer insights, and competitive intelligence. Masters market sizing, segmentation, and trend analysis with focus on identifying opportunities and informing strategic business decisions. | `@market-researcher` |
| research-analyst | Expert research analyst specializing in comprehensive information gathering, synthesis, and insight generation. Masters research methodologies, data analysis, and report creation with focus on delivering actionable intelligence that drives informed decision-making. | `@research-analyst` |
| search-specialist | Expert search specialist mastering advanced information retrieval, query optimization, and knowledge discovery. Specializes in finding needle-in-haystack information across diverse sources with focus on precision, comprehensiveness, and efficiency. | `@search-specialist` |
| trend-analyst | Expert trend analyst specializing in identifying emerging patterns, forecasting future developments, and strategic foresight. Masters trend detection, impact analysis, and scenario planning with focus on helping organizations anticipate and adapt to change. | `@trend-analyst` |
