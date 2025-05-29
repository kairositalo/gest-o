import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { UserModal } from "@/components/modals/user-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Edit, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message,
      });
    },
  });

  const getRoleText = (role: string) => {
    switch (role) {
      case "administrador":
        return "Administrador";
      case "gestor":
        return "Gestor";
      case "especialista":
        return "Especialista";
      case "analista":
        return "Analista";
      case "projetista":
        return "Projetista";
      case "gestor_final":
        return "Gestor Final";
      default:
        return role;
    }
  };

  const handleEditUser = (userToEdit: any) => {
    setEditingUser(userToEdit);
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        updates: { isActive: !currentStatus },
      });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const canManageUsers = user?.role === "administrador" || user?.role === "gestor";

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <TopBar title="Usuários" subtitle="Gerenciamento de usuários" />
          <main className="p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Acesso Negado
                </h3>
                <p className="text-gray-600">
                  Você não tem permissão para acessar esta página.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <TopBar title="Usuários" subtitle="Gerenciamento de usuários" />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando usuários...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar 
          title="Usuários" 
          subtitle="Gerenciamento de usuários do sistema"
        />

        <main className="p-6">
          {/* Header with actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todos os Usuários</h1>
              <p className="text-gray-600">
                {users?.length || 0} usuário(s) cadastrado(s)
              </p>
            </div>
            <Button onClick={() => setShowUserModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          {/* Users List */}
          {!users || users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Crie o primeiro usuário para começar.
                </p>
                <Button onClick={() => setShowUserModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userItem: any) => (
                    <div
                      key={userItem.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {userItem.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{userItem.name}</h4>
                          <p className="text-sm text-gray-600">{userItem.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`role-${userItem.role}`}>
                          {getRoleText(userItem.role)}
                        </Badge>
                        
                        <Badge variant={userItem.isActive ? "default" : "secondary"}>
                          {userItem.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditUser(userItem)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(userItem.id, userItem.isActive)}
                            >
                              {userItem.isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <UserModal 
        open={showUserModal} 
        onOpenChange={(open) => {
          setShowUserModal(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
        user={editingUser}
      />
    </div>
  );
}
