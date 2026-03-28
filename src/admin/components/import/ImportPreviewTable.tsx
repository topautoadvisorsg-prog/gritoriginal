import { CheckCircle2, AlertTriangle, XCircle, Copy, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";

export interface ImportRow {
  id: string;
  data: Record<string, string>;
  status: "ready" | "duplicate" | "conflict" | "error";
  statusMessage?: string;
  matchedFighterId?: string;
}

interface ImportPreviewTableProps {
  rows: ImportRow[];
  columns: string[];
  onRowAction: (rowId: string, action: "skip" | "replace" | "import") => void;
}

const ImportPreviewTable = ({ rows, columns, onRowAction }: ImportPreviewTableProps) => {
  const readyCount = rows.filter(r => r.status === "ready").length;
  const duplicateCount = rows.filter(r => r.status === "duplicate").length;
  const conflictCount = rows.filter(r => r.status === "conflict").length;
  const errorCount = rows.filter(r => r.status === "error").length;

  const getStatusIcon = (status: ImportRow["status"]) => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="w-4 h-4 text-win" />;
      case "duplicate":
        return <Copy className="w-4 h-4 text-warning" />;
      case "conflict":
        return <ArrowRightLeft className="w-4 h-4 text-accent" />;
      case "error":
        return <XCircle className="w-4 h-4 text-loss" />;
    }
  };

  const getStatusBadge = (status: ImportRow["status"]) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-win/20 text-win border-win/30">Ready</Badge>;
      case "duplicate":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Duplicate</Badge>;
      case "conflict":
        return <Badge className="bg-accent/20 text-accent border-accent/30">Conflict</Badge>;
      case "error":
        return <Badge className="bg-loss/20 text-loss border-loss/30">Error</Badge>;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-lg">Import Preview</CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-win" />
              <span className="text-muted-foreground">{readyCount} ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Copy className="w-4 h-4 text-warning" />
              <span className="text-muted-foreground">{duplicateCount} duplicates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">{conflictCount} conflicts</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-loss" />
                <span className="text-muted-foreground">{errorCount} errors</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[100px]">Status</TableHead>
                  {columns.slice(0, 5).map((col) => (
                    <TableHead key={col} className="min-w-[120px]">
                      {col}
                    </TableHead>
                  ))}
                  <TableHead className="w-[180px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={`border-border/30 ${
                      row.status === "duplicate" || row.status === "conflict" 
                        ? "bg-warning/5" 
                        : row.status === "error" 
                        ? "bg-loss/5" 
                        : ""
                    }`}
                  >
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(row.status)}
                              {getStatusBadge(row.status)}
                            </div>
                          </TooltipTrigger>
                          {row.statusMessage && (
                            <TooltipContent>
                              <p>{row.statusMessage}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {columns.slice(0, 5).map((col) => (
                      <TableCell key={col} className="font-medium">
                        {row.data[col] || "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {row.status === "ready" ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onRowAction(row.id, "skip")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Skip
                        </Button>
                      ) : row.status === "duplicate" || row.status === "conflict" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onRowAction(row.id, "skip")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Skip
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => onRowAction(row.id, "replace")}
                          >
                            Replace
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Blocked</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ImportPreviewTable;
