import { useState } from "react";
import { ArrowLeft, ArrowRight, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Users, Swords } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import ImportFileUpload from "./ImportFileUpload";
import ImportFieldMapping from "./ImportFieldMapping";
import { FieldMapping } from "@/shared/types/fighter";
import FightHistoryFieldMapping from "./FightHistoryFieldMapping";
import ImportPreviewTable, { ImportRow } from "./ImportPreviewTable";
import ImportSummary from "./ImportSummary";
import { useFighters } from "@/shared/hooks/useFighters";
import { useFightHistory } from "@/shared/hooks/useFightHistory";
import { transformCsvDataToFighters, validateMappings } from "@/shared/utils/fighterTransform";
import { transformCsvDataToFightRecords, validateFightHistoryMappings } from "@/shared/utils/fightHistoryTransform";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { cn } from "@/shared/lib/utils";
import { parseCSV } from "./csvParser";
import { autoMapFields } from "./autoMapper";
import { detectFighterDuplicates, detectFightHistoryDuplicates } from "./duplicateDetection";

type ImportStep = "upload" | "mapping" | "preview" | "complete";
type DataType = "fighters" | "fightHistory";

const STEPS = [
  { id: "upload", label: "Upload File", icon: Upload },
  { id: "mapping", label: "Map Fields", icon: FileSpreadsheet },
  { id: "preview", label: "Review & Import", icon: CheckCircle },
];

const ImportPage = () => {
  const { fighters, addFighters } = useFighters();
  const { fights, addFights } = useFightHistory();
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [dataType, setDataType] = useState<DataType>("fighters");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [mappingWarning, setMappingWarning] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    
    const content = await selectedFile.text();
    const { headers, data } = parseCSV(content);
    
    setCsvHeaders(headers);
    setCsvData(data);
    
    // Auto-map fields based on data type
    const autoMappings = autoMapFields(headers, dataType);
    setMappings(autoMappings);
    setMappingWarning(null);
    setCurrentStep("mapping");
    toast.success(`Loaded ${data.length} rows from ${selectedFile.name}`);
  };

  const handleFileClear = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMappings([]);
    setImportRows([]);
    setMappingWarning(null);
    setCurrentStep("upload");
  };

  const handleMappingChange = (csvField: string, systemField: string | null) => {
    setMappings(prev => prev.map(m => 
      m.csvField === csvField 
        ? { ...m, systemField, status: systemField ? "mapped" : "ignored" }
        : m
    ));
    setMappingWarning(null);
  };

  const handleProceedToPreview = () => {
    // Validate required mappings based on data type
    if (dataType === "fighters") {
      const validation = validateMappings(mappings);
      if (!validation.isValid) {
        setMappingWarning(`Missing required fields: ${validation.missingFields.join(', ')}`);
        return;
      }
      const rows = detectFighterDuplicates(csvData, mappings, fighters);
      setImportRows(rows);
    } else {
      const validation = validateFightHistoryMappings(mappings);
      if (!validation.isValid) {
        setMappingWarning(`Missing required fields: ${validation.missingFields.join(', ')}`);
        return;
      }
      const rows = detectFightHistoryDuplicates(csvData, mappings, fighters, fights);
      setImportRows(rows);
    }
    
    setCurrentStep("preview");
  };

  const handleRowAction = (rowId: string, action: "skip" | "replace" | "import") => {
    setImportRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      
      switch (action) {
        case "skip":
          return { ...row, status: "error" as const, statusMessage: "Skipped by user" };
        case "replace":
          return { ...row, status: "ready" as const, statusMessage: "Will replace existing data", action: "replace" as const };
        default:
          return row;
      }
    }));
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress(0);

    const rowsToImport = importRows.filter(r => r.status === "ready");
    const rowsToReplace = rowsToImport.filter(r => r.statusMessage === "Will replace existing data");
    const rowsToAdd = rowsToImport.filter(r => r.statusMessage !== "Will replace existing data");

    // Simulate progress
    for (let i = 0; i <= 50; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setImportProgress(i);
    }

    if (dataType === "fighters") {
      // Transform CSV data to Fighter objects
      const newFighters = transformCsvDataToFighters(
        rowsToAdd.map(r => r.data),
        mappings
      );
      
      const replaceFighters = transformCsvDataToFighters(
        rowsToReplace.map(r => r.data),
        mappings
      );

      try {
        if (newFighters.length > 0) {
          await addFighters(newFighters, 'add');
        }

        if (replaceFighters.length > 0) {
          await addFighters(replaceFighters, 'replace');
        }

        const totalImported = newFighters.length + replaceFighters.length;
        toast.success(`Successfully imported ${totalImported} fighter records`);
      } catch (err) {
        console.error('Failed to import fighters:', err);
        toast.error('Failed to import fighter records. Please try again.');
      }
    } else {
      // Fighter lookup function for fight history
      const fighterLookup = (name: string): string | undefined => {
        const [firstName, ...lastParts] = name.split(' ');
        const lastName = lastParts.join(' ');
        const fighter = fighters.find(f => 
          f.firstName.toLowerCase() === firstName?.toLowerCase() && 
          f.lastName.toLowerCase() === lastName?.toLowerCase()
        );
        return fighter?.id;
      };

      // Transform CSV data to FightRecord objects
      const newFights = transformCsvDataToFightRecords(
        rowsToAdd.map(r => r.data),
        mappings,
        fighterLookup
      );
      
      const replaceFights = transformCsvDataToFightRecords(
        rowsToReplace.map(r => r.data),
        mappings,
        fighterLookup
      );

      try {
        if (newFights.length > 0) {
          await addFights(newFights as any, 'add');
        }

        if (replaceFights.length > 0) {
          await addFights(replaceFights as any, 'replace');
        }

        const totalImported = newFights.length + replaceFights.length;
        toast.success(`Successfully imported ${totalImported} fight history records`);
      } catch (err) {
        console.error('Failed to import fight history:', err);
        toast.error('Failed to import fight history records. Please try again.');
      }
    }

    // Complete progress
    for (let i = 60; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setImportProgress(i);
    }

    setIsImporting(false);
    setCurrentStep("complete");
  };

  const handleStartOver = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMappings([]);
    setImportRows([]);
    setCurrentStep("upload");
    setIsImporting(false);
    setImportProgress(0);
    setMappingWarning(null);
  };

  const handleDataTypeChange = (type: DataType) => {
    setDataType(type);
    // Re-map fields if we have data
    if (csvHeaders.length > 0) {
      const autoMappings = autoMapFields(csvHeaders, type);
      setMappings(autoMappings);
    }
  };

  const readyRows = importRows.filter(r => r.status === "ready").length;
  const duplicateRows = importRows.filter(r => r.status === "duplicate").length;
  const skippedRows = importRows.filter(r => r.status === "error" && r.statusMessage === "Skipped by user").length;
  const errorRows = importRows.filter(r => r.status === "error" && r.statusMessage !== "Skipped by user").length;
  const replacingRows = importRows.filter(r => r.status === "ready" && r.statusMessage === "Will replace existing data").length;

  const getStepIndex = (step: ImportStep) => {
    if (step === "complete") return 3;
    return STEPS.findIndex(s => s.id === step);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Upload and import fighter or fight history data into the system
        </p>
        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
          {fighters.length > 0 && (
            <span>Fighters: {fighters.length}</span>
          )}
          {fights.length > 0 && (
            <span>Fight Records: {fights.length}</span>
          )}
        </div>
      </div>

      {/* Data Type Selector */}
      {currentStep === "upload" && (
        <div className="flex gap-4">
          <button
            onClick={() => handleDataTypeChange("fighters")}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
              dataType === "fighters" 
                ? "border-primary bg-primary/10 text-foreground" 
                : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border"
            )}
          >
            <Users className={cn("w-6 h-6", dataType === "fighters" ? "text-primary" : "")} />
            <div className="text-left">
              <div className="font-semibold">Fighter Data</div>
              <div className="text-sm opacity-70">Import fighter profiles and stats</div>
            </div>
          </button>
          <button
            onClick={() => handleDataTypeChange("fightHistory")}
            className={cn(
              "flex-1 p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3",
              dataType === "fightHistory" 
                ? "border-primary bg-primary/10 text-foreground" 
                : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border"
            )}
          >
            <Swords className={cn("w-6 h-6", dataType === "fightHistory" ? "text-primary" : "")} />
            <div className="text-left">
              <div className="font-semibold">Fight History</div>
              <div className="text-sm opacity-70">Import historical fight records</div>
            </div>
          </button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = step.id === currentStep;
          const isComplete = getStepIndex(currentStep) > index || currentStep === "complete";
          
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${isActive ? "bg-primary text-primary-foreground" : ""}
                ${isComplete && !isActive ? "bg-win/20 text-win" : ""}
                ${!isActive && !isComplete ? "bg-muted/30 text-muted-foreground" : ""}
              `}>
                <StepIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === "upload" && (
        <ImportFileUpload
          file={file}
          onFileSelect={handleFileSelect}
          onFileClear={handleFileClear}
        />
      )}

      {currentStep === "mapping" && (
        <div className="space-y-6">
          {mappingWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{mappingWarning}</AlertDescription>
            </Alert>
          )}
          
          {dataType === "fighters" ? (
            <ImportFieldMapping
              csvHeaders={csvHeaders}
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />
          ) : (
            <FightHistoryFieldMapping
              csvHeaders={csvHeaders}
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />
          )}
          
          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleFileClear}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleProceedToPreview}>
              Continue to Preview
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ImportPreviewTable
              rows={importRows}
              columns={csvHeaders}
              onRowAction={handleRowAction}
            />
          </div>
          <div>
            <ImportSummary
              totalRows={csvData.length}
              readyRows={readyRows}
              duplicateRows={duplicateRows}
              skippedRows={skippedRows + errorRows}
              replacingRows={replacingRows}
              isImporting={isImporting}
              importProgress={importProgress}
              onConfirmImport={handleConfirmImport}
              onCancel={() => setCurrentStep("mapping")}
            />
          </div>
        </div>
      )}

      {currentStep === "complete" && (
        <Card className="glass-card border-win/30">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-win/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-win" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Import Complete!
            </h2>
            <p className="text-muted-foreground mb-2">
              Successfully imported {readyRows + replacingRows} {dataType === "fighters" ? "fighter" : "fight history"} records.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {dataType === "fighters" 
                ? `Total fighters in database: ${fighters.length}`
                : `Total fight records in database: ${fights.length}`
              }
            </p>
            <Button onClick={handleStartOver}>
              Import More Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;
