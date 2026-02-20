import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type CellValue = true | false | string;

interface ComparisonRow {
  feature: string;
  reviewstack: CellValue;
  birdeye: CellValue;
  podium: CellValue;
  nicejob: CellValue;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Starting Price",
    reviewstack: "$19/mo",
    birdeye: "$299/mo",
    podium: "~$249/mo",
    nicejob: "$75/mo",
  },
  {
    feature: "AI Review Responses",
    reviewstack: "All tiers",
    birdeye: "$299+ only",
    podium: "Add-on",
    nicejob: "Pro only",
  },
  {
    feature: "Sentiment Analysis",
    reviewstack: true,
    birdeye: true,
    podium: "Basic",
    nicejob: false,
  },
  {
    feature: "Multi-Location",
    reviewstack: true,
    birdeye: true,
    podium: true,
    nicejob: false,
  },
  {
    feature: "Free Tier",
    reviewstack: true,
    birdeye: false,
    podium: false,
    nicejob: false,
  },
  {
    feature: "No Annual Contract",
    reviewstack: true,
    birdeye: false,
    podium: false,
    nicejob: true,
  },
  {
    feature: "Self-Service Signup",
    reviewstack: true,
    birdeye: true,
    podium: false,
    nicejob: true,
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return <Check className="mx-auto h-5 w-5 text-green-600" />;
  }
  if (value === false) {
    return <X className="mx-auto h-5 w-5 text-red-400" />;
  }
  return (
    <span className="text-sm text-muted-foreground">{value}</span>
  );
}

export function Comparison() {
  return (
    <section id="comparison" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">How we compare</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            AI review responses and reputation management at a fraction of the
            price.
          </p>
        </div>
        <div className="mt-12 overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Feature</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-primary">ReviewStack</span>
                    <Badge variant="secondary" className="text-xs">
                      You are here
                    </Badge>
                  </div>
                </TableHead>
                <TableHead className="text-center">Birdeye</TableHead>
                <TableHead className="text-center">Podium</TableHead>
                <TableHead className="text-center">NiceJob</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell className="bg-primary/5 text-center">
                    <CellContent value={row.reviewstack} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellContent value={row.birdeye} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellContent value={row.podium} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CellContent value={row.nicejob} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
