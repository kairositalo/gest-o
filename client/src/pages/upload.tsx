import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { UploadModal } from "@/components/modals/upload-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileType, Download, Eye } from "lucide-react";

export default function UploadPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: files, isLoading } = useQuery({
    queryKey: ["/api/projects", selectedProject, "files"],
    enabled: !!selectedProject,
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      case "revisao":
        return "Em Revisão";
      default:
        return status;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) {
      return "📄";
    }
    if (mimeType.includes("dwg") || mimeType.includes("autocad")) {
      return "📐";
    }
    return "📁";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64">
        <TopBar 
          title="Upload de Arquivos" 
          subtitle="Gerenciamento de arquivos do projeto"
        />

        <main className="p-6">
          {/* Header with actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Arquivos</h1>
              <p className="text-gray-600">
                Envie e gerencie arquivos dos projetos (.dwg e .pdf)
              </p>
            </div>
            <Button 
              onClick={() => setShowUploadModal(true)}
              disabled={!selectedProject}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Arquivos
            </Button>
          </div>

          {/* Project Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecionar Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Escolha um projeto..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Files List */}
          {!selectedProject ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileType className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um projeto
                </h3>
                <p className="text-gray-600">
                  Escolha um projeto acima para visualizar e gerenciar seus arquivos.
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando arquivos...</p>
              </CardContent>
            </Card>
          ) : !files || files.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum arquivo encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Este projeto ainda não possui arquivos enviados.
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Primeiro Arquivo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Arquivos do Projeto</CardTitle>
                  <span className="text-sm text-gray-600">
                    {files.length} arquivo(s)
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{formatFileSize(file.size)}</span>
                            <span>v{file.version}</span>
                            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`status-${file.status}`}>
                          {getStatusText(file.status)}
                        </Badge>
                        
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <UploadModal 
        open={showUploadModal} 
        onOpenChange={setShowUploadModal}
        selectedProjectId={selectedProject}
      />
    </div>
  );
}
