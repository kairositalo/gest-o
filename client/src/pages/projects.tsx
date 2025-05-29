import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ProjectModal } from "@/components/modals/project-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { FolderPlus, Users, Calendar, AlertCircle } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [showProjectModal, setShowProjectModal] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "planejamento":
        return "Planejamento";
      case "em_andamento":
        return "Em Andamento";
      case "aguardando_revisao":
        return "Aguardando Revisão";
      case "aprovado":
        return "Aprovado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "baixa":
        return "Baixa";
      case "media":
        return "Média";
      case "alta":
        return "Alta";
      case "critica":
        return "Crítica";
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64">
          <TopBar title="Projetos" subtitle="Gerenciamento de projetos" />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando projetos...</p>
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
          title="Projetos" 
          subtitle="Gerenciamento de projetos"
        />

        <main className="p-6">
          {/* Header with actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todos os Projetos</h1>
              <p className="text-gray-600">
                {projects?.length || 0} projeto(s) encontrado(s)
              </p>
            </div>
            {(user?.role === "administrador" || user?.role === "gestor") && (
              <Button onClick={() => setShowProjectModal(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          {!projects || projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum projeto encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {user?.role === "administrador" || user?.role === "gestor"
                    ? "Crie seu primeiro projeto para começar."
                    : "Você não está alocado em nenhum projeto ainda."
                  }
                </p>
                {(user?.role === "administrador" || user?.role === "gestor") && (
                  <Button onClick={() => setShowProjectModal(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Criar Primeiro Projeto
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {project.name}
                      </CardTitle>
                      <Badge className={`priority-${project.priority}`}>
                        {getPriorityText(project.priority)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {project.description || "Sem descrição"}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge className={`status-${project.status}`}>
                        {getStatusText(project.status)}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Equipe</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <ProjectModal 
        open={showProjectModal} 
        onOpenChange={setShowProjectModal} 
      />
    </div>
  );
}
