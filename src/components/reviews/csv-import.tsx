"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParsedReview {
  source: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
}

interface CsvImportProps {
  locationId: string;
  onImportComplete?: () => void;
}

const VALID_SOURCES = ["google", "yelp", "facebook", "other"];

export function CsvImport({ locationId, onImportComplete }: CsvImportProps) {
  const [parsedRows, setParsedRows] = useState<ParsedReview[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const errors: string[] = [];
        const rows: ParsedReview[] = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as Record<string, string>;
          const rowNum = i + 2; // 1-indexed + header row

          const rating = parseInt(row.rating, 10);
          if (!row.review_text || row.review_text.trim().length < 5) {
            errors.push(`Row ${rowNum}: review_text is required (min 5 chars)`);
            continue;
          }
          if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push(`Row ${rowNum}: rating must be 1-5`);
            continue;
          }

          const source = (row.source || "google").toLowerCase().trim();

          rows.push({
            source: VALID_SOURCES.includes(source) ? source : "other",
            reviewer_name: row.reviewer_name?.trim() || "",
            rating,
            review_text: row.review_text.trim(),
            review_date: row.review_date?.trim() || "",
          });
        }

        setParsedRows(rows);
        if (errors.length > 0) {
          setParseErrors(errors);
        }
      },
      error(err) {
        toast.error(`Failed to parse CSV: ${err.message}`);
      },
    });
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;

    setImporting(true);
    try {
      const payload = {
        location_id: locationId,
        reviews: parsedRows.map((r) => ({
          source: r.source,
          reviewer_name: r.reviewer_name || undefined,
          rating: r.rating,
          review_text: r.review_text,
          review_date: r.review_date || undefined,
        })),
      };

      const res = await fetch("/api/reviews/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to import reviews");

      toast.success(`Successfully imported ${json.imported} reviews`);
      // Reset state
      setParsedRows([]);
      setFileName(null);
      setParseErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onImportComplete?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import reviews",
      );
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setParsedRows([]);
    setFileName(null);
    setParseErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Reviews from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with columns:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            source, reviewer_name, rating, review_text, review_date
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File input */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {fileName ? "Change File" : "Select CSV File"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {fileName && (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {fileName}
            </span>
          )}
        </div>

        {/* Parse errors */}
        {parseErrors.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
            <p className="mb-1 text-sm font-medium text-destructive">
              {parseErrors.length} validation{" "}
              {parseErrors.length === 1 ? "error" : "errors"}:
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-destructive">
              {parseErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {parseErrors.length > 5 && (
                <li>...and {parseErrors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review Text</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="capitalize">{row.source}</TableCell>
                      <TableCell>{row.reviewer_name || "—"}</TableCell>
                      <TableCell>{"★".repeat(row.rating)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.review_text}
                      </TableCell>
                      <TableCell>{row.review_date || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedRows.length > 5 && (
              <p className="text-xs text-muted-foreground">
                Showing first 5 of {parsedRows.length} rows
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${parsedRows.length} Reviews`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
