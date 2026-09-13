7. Luồng thực tế khi một project mới được setup

Ví dụ bạn có:

my-project/

Bạn chạy:

npm install -g @aristha/ctxpack

sau đó:

cd my-project
ctxpack init

CLI sẽ setup:

my-project/
│
├── .agent/
│   ├── skills/
│   │   └── context-pack-registry/
│   ├── ctxpack.json
│   └── ctxpack.lock.json
│
├── .claude/
│   └── skills/
│       └── context-pack-registry
│
├── .mcp.json
│
└── .gitattributes

Trong .mcp.json sẽ có cấu hình kiểu:

{
  "agent-registry": {
    "url": "http://localhost:8000/mcp"
  }
}

Sau đó MCP server được chạy:

docker compose up --build

và cung cấp:

localhost:8000/mcp

Claude Code đọc .mcp.json → biết MCP server ở đâu → kết nối vào Agent Registry.


8. Khi AI agent bắt đầu làm việc

Có thể hình dung flow như sau:

Claude Code
     │
     │ đọc .claude/skills/context-pack-registry
     │
     ▼
Context Pack Registry Skill
     │
     │ MCP
     ▼
Agent Registry MCP
     │
     ├── project_register
     │
     ├── context_search
     │
     ├── skill_search
     │
     ├── memory_search
     │
     └── memory_register
     │
     ▼
PostgreSQL

Ví dụ agent vào project:

1. Detect project
       ↓
2. project_register
       ↓
3. context_get/search
       ↓
4. memory_search
       ↓
5. đọc skill/policy
       ↓
6. bắt đầu coding

Đó chính là ý của đoạn README MCP:

Each client project should register its stable slug and locally computed ProjectModel at the start of an agent session.