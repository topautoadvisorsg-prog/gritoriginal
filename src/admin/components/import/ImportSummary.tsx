import { CheckCircle2, AlertTriangle, FileUp, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";

interface ImportSummaryProps {
  totalRows: number;
  readyRows: number;
  duplicateRows: number;
  skippedRows: number;
  replacingRows: number;
  isImporting: boolean;
  importProgress: number;
  onConfirmImport: () => void;
  onCancel: () => void;
}

const ImportSummary = ({
  totalRows,
  readyRows,
  duplicateRows,
  skippedRows,
  replacingRows,
  isImporting,
  importProgress,
  onConfirmImport,
  onCancel,
}: ImportSummaryProps) => {
  const toImport = readyRows + replacingRows;
  const blocked = duplicateRows - replacingRows;

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Import Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isImporting ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                Importing data...
              </p>
              <p className="text-sm text-muted-foreground">
                Please don't close this page
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(importProgress)}% complete
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-win" />
                  <span className="text-sm text-muted-foreground">Ready to Import</span>
                </div>
                <p className="text-2xl font-bold text-win">{readyRows}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Will Replace</span>
                </div>
                <p className="text-2xl font-bold text-warning">{replacingRows}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Skipped</span>
                </div>
                <p className="text-2xl font-bold text-muted-foreground">{skippedRows}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4 text-loss" />
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <p className="text-2xl font-bold text-loss">{blocked}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total records to import</p>
                  <p className="text-3xl font-bold text-primary">{toImport}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>from {totalRows} total rows</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={onConfirmImport}
                disabled={toImport === 0}
              >
                Confirm Import
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportSummary;
