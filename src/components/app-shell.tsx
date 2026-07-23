import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  LayoutDashboard,
  Users,
  Megaphone,
  Radar,
  Image as ImageIcon,
  ShieldCheck,
  GaugeCircle,
  Filter,
  Settings,
  Search,
  Bell,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/performance", label: "Performance", icon: GaugeCircle },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/publishers", label: "Publishers", icon: Users },
      { to: "/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/funnel", label: "Funnel", icon: Filter },
    ],
  },
  {
    label: "Growth",
    items: [{ to: "/outreach", label: "Outreach", icon: Radar }],
  },
  {
    label: "Assets",
    items: [
      { to: "/creative", label: "Creative Hub", icon: ImageIcon },
      { to: "/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-background text-foreground">
      <Sidebar />
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Activity className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Affiliate</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            automation
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-5 first:mt-2">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={[
                        "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-4 w-4",
                          active ? "text-primary" : "text-muted-foreground",
                        ].join(" ")}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Sync status
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-sidebar-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Everflow · live
          </p>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return {
        email: user.email,
        full_name: data?.full_name ?? user.email,
        avatar_url: data?.avatar_url ?? null,
      };
    },
  });

  const initials =
    (profile?.full_name ?? profile?.email ?? "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-6 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search publishers, campaigns, IDs…"
          className="h-9 pl-9"
        />
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm hover:bg-accent">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {initials}
            </div>
            <span className="hidden max-w-[160px] truncate sm:inline">
              {profile?.full_name ?? "Loading…"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm">{profile?.full_name}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {profile?.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
