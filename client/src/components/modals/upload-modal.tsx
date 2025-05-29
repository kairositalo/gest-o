import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, FileText, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjectId?: string;
}

interface FileWithPreview extends File {
  id: string;
  preview?: string;
}

export function UploadModal({ open, onOpenChange, selectedProjectId }: UploadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(selectedProjectId || "");
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro no upload");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Upload realizado com sucesso",
        description: `${selectedFiles.length} arquivo(s) enviado(s).`,
      });
      onOpenChange(false);
      setSelectedFiles([]);
      setProjectId("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message,
      });
    },
  });

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['.dwg', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Apenas arquivos ${allowedTypes.join(', ')} são permitidos`;
    }
    
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return "Arquivo muito grande. Tamanho máximo: 50MB";
    }
    
    return null;
  };

  const handleFileSelect = useCallback((files: File[]) => {
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          id: Math.random().toString(36).substring(7),
        });
        validFiles.push(fileWithPreview);
      }
    });

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Alguns arquivos foram rejeitados",
        description: errors.join('\n'),
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return <FileText className="h-6 w-6 text-red-600" />;
    }
    if (extension === 'dwg') {
      return <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">DWG</div>;
    }
    return <FileText className="h-6 w-6 text-gray-600" />;
  };

  const handleUpload = async () => {
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um projeto antes de enviar os arquivos.",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos um arquivo para enviar.",
      });
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    await uploadMutation.mutateAsync(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Arquivos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Selecionar Projeto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
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
          </div>
          
          {/* File Upload Area */}
          <div
            className={cn(
              "upload-area",
              isDragOver && "drag-over"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CloudUpload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arraste arquivos ou clique para selecionar
                </p>
                <p className="text-gray-600">
                  Suporte para arquivos .dwg e .pdf (máx. 50MB)
                </p>
              </div>
              <Button type="button" className="mx-auto">
                Selecionar Arquivos
              </Button>
            </div>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".dwg,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          
          {/* File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 text-sm font-medium">✓ Pronto</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !projectId || selectedFiles.length === 0}
            >
              {uploadMutation.isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Arquivos
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
