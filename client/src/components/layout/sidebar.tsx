import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  FolderKanban, 
  Home, 
  Folder, 
  Upload, 
  BarChart3, 
  Users, 
  Shield, 
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projetos", href: "/projects", icon: Folder },
  { name: "Upload de Arquivos", href: "/upload", icon: Upload },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

const adminNavigation = [
  { name: "Usuários", href: "/users", icon: Users },
  { name: "Permissões", href: "/permissions", icon: Shield },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const canAccessAdmin = user?.role === "administrador" || user?.role === "gestor";

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg border-r border-gray-200 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
          <FolderKanban className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AxionPro</h1>
          <p className="text-xs text-gray-600">v2.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10",
                isActive
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => setLocation(item.href)}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          );
        })}

        {/* Admin Section */}
        {canAccessAdmin && (
          <>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Administração
              </h3>
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setLocation(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-600">
              {user?.role === "administrador" ? "Administrador" :
               user?.role === "gestor" ? "Gestor" :
               user?.role === "especialista" ? "Especialista" :
               user?.role === "analista" ? "Analista" :
               user?.role === "projetista" ? "Projetista" :
               user?.role === "gestor_final" ? "Gestor Final" :
               user?.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
