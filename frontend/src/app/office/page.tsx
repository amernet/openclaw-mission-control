"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { SignedIn } from "@/auth/clerk";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { customFetch } from "@/api/mutator";

type AgentData = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  status: "online" | "idle";
  currentTask: string;
};

type AgentPosition = {
  x: number;
  y: number;
  deskX: number;
  deskY: number;
  color: string;
  targetX?: number;
  targetY?: number;
  isWalking: boolean;
  walkPause: number;
};

const FALLBACK_AGENTS: AgentData[] = [
  { id: "jarvis", name: "Jarvis", emoji: "🦞", role: "main", status: "online", currentTask: "Processing requests" },
  { id: "ace", name: "Ace", emoji: "📊", role: "accounting", status: "online", currentTask: "Invoice verification" },
  { id: "tex", name: "Tex", emoji: "🛠️", role: "support", status: "online", currentTask: "Monitoring tickets" },
  { id: "max", name: "Max", emoji: "🎯", role: "marketing", status: "online", currentTask: "Campaign analysis" },
];

const AGENT_COLORS: Record<string, string> = {
  jarvis: "#FF8C42", // orange
  ace: "#4A90E2",    // blue
  tex: "#50C878",    // green
  max: "#9B59B6",    // purple
};

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 600;
const WATER_COOLER_X = 950;
const WATER_COOLER_Y = 300;

export default function OfficePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [agents, setAgents] = useState<AgentData[]>(FALLBACK_AGENTS);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [activities, setActivities] = useState<Array<{ id: string; event_type: string; description: string; agent_name?: string; created_at: string }>>([]);
  const agentPositionsRef = useRef(new Map<string, AgentPosition>());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastWalkTimeRef = useRef(0);
  const typingDotsRef = useRef(new Map<string, number>());

  // Initialize agent positions
  useEffect(() => {
    // Clear positions when agent list changes (e.g. fallback → API)
    if (agentPositionsRef.current.size > 0) {
      const existingIds = new Set(agents.map(a => a.id));
      for (const key of agentPositionsRef.current.keys()) {
        if (!existingIds.has(key)) agentPositionsRef.current.delete(key);
      }
    }
    const deskPositions = [
      { x: 200, y: 150 },
      { x: 500, y: 150 },
      { x: 200, y: 350 },
      { x: 500, y: 350 },
    ];

    agents.forEach((agent, index) => {
      if (!agentPositionsRef.current.has(agent.id)) {
        const desk = deskPositions[index] || deskPositions[0];
        const nameKey = agent.name.toLowerCase();
        agentPositionsRef.current.set(agent.id, {
          x: desk.x,
          y: desk.y,
          deskX: desk.x,
          deskY: desk.y,
          color: AGENT_COLORS[nameKey] || AGENT_COLORS[agent.id] || "#888",
          isWalking: false,
          walkPause: 0,
        });
      }
    });
  }, [agents]);

  // Fetch agent data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const emojiMap: Record<string, string> = { jarvis: "🦞", ace: "📊", tex: "🛠️", max: "🎯" };
        // Fetch agents
        try {
          const ar = await customFetch<{ data: { items: Array<{ id: string; name: string; status: string }> } }>("/api/v1/agents", { method: "GET" });
          const ai = ar?.data?.items;
          if (Array.isArray(ai) && ai.length > 0) {
            setAgents(ai.map((a) => ({
              id: a.id, name: a.name,
              emoji: emojiMap[a.name.toLowerCase()] || "🤖",
              role: a.name.toLowerCase(),
              status: (a.status === "online" ? "online" : "idle") as "online" | "idle",
              currentTask: "Working...",
            })));
          }
        } catch { /* fallback */ }
        // Fetch tasks
        try {
          const tr = await customFetch<{ data: { items: Array<{ status: string }>; total: number } }>("/api/v1/boards/367c5ec4-1d34-425e-b0ba-35eff32c3b49/tasks?limit=50", { method: "GET" });
          const ti = tr?.data?.items;
          if (Array.isArray(ti)) {
            setTaskCount(ti.filter((t) => t.status !== "done").length);
          }
        } catch { /* ignore */ }
        // Fetch activity
        try {
          const ac = await customFetch<{ data: { items: Array<{ id: string; event_type: string; description: string; agent_name?: string; created_at: string }> } }>("/api/v1/activity?limit=10", { method: "GET" });
          const al = ac?.data?.items;
          if (Array.isArray(al)) { setActivities(al); }
        } catch { /* ignore */ }
      } catch (error) {
        // Use fallback data
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFloor = () => {
      // Dark background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Checkerboard floor
      const tileSize = 40;
      for (let x = 0; x < CANVAS_WIDTH; x += tileSize) {
        for (let y = 0; y < CANVAS_HEIGHT; y += tileSize) {
          const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? "#16213e" : "#1a1a2e";
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }

      // Grid lines
      ctx.strokeStyle = "#252b48";
      ctx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
    };

    const drawDesk = (x: number, y: number) => {
      // Desk body
      ctx.fillStyle = "#5a4a3a";
      ctx.fillRect(x - 30, y - 15, 60, 30);

      // Monitor
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(x - 15, y - 35, 30, 25);
      
      // Screen glow
      const glowIntensity = 0.3 + Math.sin(Date.now() / 1000) * 0.1;
      ctx.fillStyle = `rgba(74, 144, 226, ${glowIntensity})`;
      ctx.fillRect(x - 12, y - 32, 24, 19);
    };

    const drawAgent = (agent: AgentData, pos: AgentPosition) => {
      const { x, y, color } = pos;

      // Agent body (rectangle robot)
      ctx.fillStyle = color;
      ctx.fillRect(x - 12, y - 12, 24, 24);

      // Eyes
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 8, y - 6, 5, 5);
      ctx.fillRect(x + 3, y - 6, 5, 5);

      // Status dot
      const statusColor = agent.status === "online" ? "#50C878" : "#888";
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(x + 15, y - 15, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pulse effect for online agents
      if (agent.status === "online") {
        const pulse = 0.3 + Math.sin(Date.now() / 500) * 0.2;
        ctx.fillStyle = `rgba(80, 200, 120, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x + 15, y - 15, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Emoji
      ctx.font = "16px Arial";
      ctx.fillText(agent.emoji, x - 20, y - 20);

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(agent.name, x, y + 25);

      // Typing animation at desk
      if (!pos.isWalking && agent.status === "online") {
        const dotCount = typingDotsRef.current.get(agent.id) || 0;
        if (Date.now() % 1000 < 500) {
          ctx.fillStyle = "#aaa";
          ctx.font = "8px Arial";
          const dots = ".".repeat((dotCount % 3) + 1);
          ctx.fillText(dots, x, y + 5);
          typingDotsRef.current.set(agent.id, dotCount + 1);
        }
      }

      // Task speech bubble
      if (!pos.isWalking && agent.status === "online" && agent.currentTask) {
        const bubbleX = x;
        const bubbleY = y - 50;
        const bubbleWidth = 140;
        const bubbleHeight = 30;

        // Bubble
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight);

        // Tail
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.moveTo(bubbleX, bubbleY + bubbleHeight / 2);
        ctx.lineTo(bubbleX - 5, bubbleY + bubbleHeight / 2 + 8);
        ctx.lineTo(bubbleX + 5, bubbleY + bubbleHeight / 2);
        ctx.fill();

        // Text
        ctx.fillStyle = "#333";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        const truncatedTask = agent.currentTask.length > 20 
          ? agent.currentTask.substring(0, 20) + "..." 
          : agent.currentTask;
        ctx.fillText(truncatedTask, bubbleX, bubbleY);
      }
    };

    const drawMeetingTable = () => {
      ctx.fillStyle = "#6b5b4a";
      ctx.beginPath();
      ctx.ellipse(550, 500, 100, 60, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawWaterCooler = () => {
      // Base
      ctx.fillStyle = "#555";
      ctx.fillRect(WATER_COOLER_X - 10, WATER_COOLER_Y + 20, 20, 10);

      // Body
      ctx.fillStyle = "#4A90E2";
      ctx.fillRect(WATER_COOLER_X - 8, WATER_COOLER_Y - 20, 16, 40);

      // Top
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(WATER_COOLER_X - 10, WATER_COOLER_Y - 25, 20, 5);
    };

    const drawPlants = () => {
      // Plant 1
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(100, 480, 10, 30);
      ctx.fillStyle = "#50C878";
      ctx.beginPath();
      ctx.arc(105, 470, 15, 0, Math.PI * 2);
      ctx.fill();

      // Plant 2
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(1000, 480, 10, 30);
      ctx.fillStyle = "#50C878";
      ctx.beginPath();
      ctx.arc(1005, 470, 15, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSprintBoard = () => {
      // Board background
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(750, 30, 120, 80);

      // Frame
      ctx.strokeStyle = "#34495e";
      ctx.lineWidth = 3;
      ctx.strokeRect(750, 30, 120, 80);

      // Title
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Sprint Board", 760, 50);

      // Task count
      ctx.font = "bold 20px Arial";
      ctx.fillText(`${taskCount}`, 760, 80);
      ctx.font = "10px Arial";
      ctx.fillText("Active Tasks", 760, 95);
    };

    const updateAgentMovement = () => {
      const now = Date.now();

      // Randomly make an agent walk to water cooler
      if (now - lastWalkTimeRef.current > 8000) {
        const walkingAgent = agents[Math.floor(Math.random() * agents.length)];
        const pos = agentPositionsRef.current.get(walkingAgent.id);

        if (pos && !pos.isWalking) {
          pos.isWalking = true;
          pos.targetX = WATER_COOLER_X;
          pos.targetY = WATER_COOLER_Y;
          pos.walkPause = 0;
          lastWalkTimeRef.current = now;
        }
      }

      // Update positions
      agentPositionsRef.current.forEach((pos, agentId) => {
        if (pos.isWalking) {
          if (pos.walkPause > 0) {
            pos.walkPause -= 16; // ~60fps
            if (pos.walkPause <= 0) {
              // Return to desk
              pos.targetX = pos.deskX;
              pos.targetY = pos.deskY;
            }
          } else if (pos.targetX !== undefined && pos.targetY !== undefined) {
            const dx = pos.targetX - pos.x;
            const dy = pos.targetY - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) {
              pos.x = pos.targetX;
              pos.y = pos.targetY;

              if (pos.x === WATER_COOLER_X && pos.y === WATER_COOLER_Y) {
                // Pause at water cooler
                pos.walkPause = 2000;
              } else {
                // Back at desk
                pos.isWalking = false;
                pos.targetX = undefined;
                pos.targetY = undefined;
              }
            } else {
              pos.x += (dx / distance) * 1.5;
              pos.y += (dy / distance) * 1.5;
            }
          }
        }
      });
    };

    const animate = () => {
      drawFloor();

      // Draw furniture
      drawMeetingTable();
      drawWaterCooler();
      drawPlants();
      drawSprintBoard();

      // Draw desks
      agents.forEach((agent, index) => {
        const pos = agentPositionsRef.current.get(agent.id);
        if (pos) {
          drawDesk(pos.deskX, pos.deskY);
        }
      });

      // Update and draw agents
      updateAgentMovement();
      agents.forEach((agent) => {
        const pos = agentPositionsRef.current.get(agent.id);
        if (pos) {
          drawAgent(agent, pos);
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [agents, taskCount]);

  return (
    <DashboardShell>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto min-h-screen" style={{ background: "#1a1a2e", color: "#fff" }}>
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">The Office</h1>
              <p className="mt-1 text-slate-400">AI team headquarters — live view</p>
            </div>

            {/* Status Legend */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status Legend
              </p>
              <div className="space-y-1.5 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                  <span>Working</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                  <span>Chatting</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
                  <span>Walking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-500"></span>
                  <span>Idle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-4">
            {/* Canvas */}
            <div className="flex-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="mx-auto block rounded-lg"
                style={{ width: "100%", maxWidth: `${CANVAS_WIDTH}px`, height: "auto", background: "#1a1a2e" }}
              />
            </div>

            {/* Live Activity Panel */}
            <div className="w-64 shrink-0 rounded-xl border border-slate-700 bg-slate-800/50 p-4 overflow-y-auto" style={{ maxHeight: `${CANVAS_HEIGHT + 32}px` }}>
              <h3 className="mb-1 text-lg font-semibold text-white">Live Activity</h3>
              <p className="text-xs text-slate-500 mb-3">Recent events</p>
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div key={act.id} className="rounded-lg border border-slate-700 bg-slate-900/30 p-2.5">
                      <p className="text-xs text-slate-300 leading-relaxed">{act.description || act.event_type}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {act.agent_name && <span className="text-[10px] font-semibold text-slate-400">{act.agent_name}</span>}
                        <span className="text-[10px] text-slate-500">{new Date(act.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/30 p-3 text-center text-sm text-slate-500">
                  No recent activity
                  <br />
                  <span className="text-xs">Events will appear here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </SignedIn>
    </DashboardShell>
  );
}
