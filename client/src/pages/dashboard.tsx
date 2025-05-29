import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { ProjectModal } from "@/components/modals/project-modal";
import { UploadModal } from "@/components/modals/upload-modal";
import { ProgressChart } from "@/components/charts/progress-chart";
import { useState } from "react";
import { 
  FolderPlus, 
  Upload, 
  BarChart3, 
  Users, 
  FileUp, 
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/dashboard/activity"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const recentProjects = projects?.slice(0, 3) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "em_andamento":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "aprovado":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "aguardando_revisao":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

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

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "upload_file":
        return <FileUp className="h-4 w-4 text-green-600" />;
      case "create_project":
        return <FolderPlus className="h-4 w-4 text-blue-600" />;
      case "review_file":
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.action) {
      case "upload_file":
        return "enviou um arquivo";
      case "create_project":
        return "criou um projeto";
      case "review_file":
        return "revisou um arquivo";
      case "login":
        return "fez login";
      default:
        return activity.action;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar 
          title="Dashboard" 
          subtitle="Visão geral do sistema"
        />

        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.totalProjects || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FolderPlus className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Arquivos Enviados</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.totalFiles || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.approvalRate || 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Projetos Recentes</CardTitle>
                    <Button variant="outline" size="sm">
                      Ver todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentProjects.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Nenhum projeto encontrado
                      </p>
                    ) : (
                      recentProjects.map((project: any) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                              <FolderPlus className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{project.name}</h4>
                              <p className="text-sm text-gray-600">{project.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`status-badge status-${project.status} flex items-center gap-1`}>
                              {getStatusIcon(project.status)}
                              {getStatusText(project.status)}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!activities || activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            Usuário {getActivityText(activity)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(user?.role === "administrador" || user?.role === "gestor") && (
                    <Button
                      onClick={() => setShowProjectModal(true)}
                      className="flex items-center gap-3 p-4 h-auto bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border-primary/20"
                      variant="outline"
                    >
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <FolderPlus className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Novo Projeto</p>
                        <p className="text-sm opacity-80">Criar projeto</p>
                      </div>
                    </Button>
                  )}

                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-3 p-4 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200"
                    variant="outline"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Upload Arquivos</p>
                      <p className="text-sm opacity-80">Enviar .dwg/.pdf</p>
                    </div>
                  </Button>

                  <Button
                    className="flex items-center gap-3 p-4 h-auto bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 border-green-200"
                    variant="outline"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Relatórios</p>
                      <p className="text-sm opacity-80">Visualizar métricas</p>
                    </div>
                  </Button>

                  {(user?.role === "administrador" || user?.role === "gestor") && (
                    <Button
                      className="flex items-center gap-3 p-4 h-auto bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border-purple-200"
                      variant="outline"
                    >
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Gerenciar Usuários</p>
                        <p className="text-sm opacity-80">Administração</p>
                      </div>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ProjectModal 
        open={showProjectModal} 
        onOpenChange={setShowProjectModal} 
      />
      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal} 
      />
    </div>
  );
}
