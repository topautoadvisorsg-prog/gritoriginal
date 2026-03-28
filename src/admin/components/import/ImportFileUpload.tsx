import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

interface ImportFileUploadProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
}

const ImportFileUpload = ({ file, onFileSelect, onFileClear }: ImportFileUploadProps) => {
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      onFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <Card className="glass-card border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onFileClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 transition-colors">
      <CardContent className="p-0">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="p-12 flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Drop your CSV file here
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: CSV files up to 10MB
          </p>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportFileUpload;
