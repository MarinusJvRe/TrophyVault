import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy, MapPin, Calendar, Star, ArrowLeft, FileText } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Trophy as TrophyType } from "@shared/schema";
import jsPDF from "jspdf";

const safeDate = (d: string | null | undefined): Date | null => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const safeDateSort = (d: string | null | undefined): number => {
  const parsed = safeDate(d);
  return parsed ? parsed.getTime() : 0;
};

export default function TrophyTimeline() {
  const { data: trophies = [], isLoading } = useQuery<TrophyType[]>({
    queryKey: ["/api/trophies"],
  });

  const [showExport, setShowExport] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sortedTrophies = [...trophies].sort((a, b) =>
    safeDateSort(b.date) - safeDateSort(a.date)
  );

  const groupedByYear: Record<string, TrophyType[]> = {};
  sortedTrophies.forEach(t => {
    const d = safeDate(t.date);
    const year = d ? d.getFullYear().toString() : "Unknown";
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(t);
  });

  const sortedYears = Object.keys(groupedByYear)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map(year => ({
      year,
      trophies: groupedByYear[year].sort((a, b) =>
        safeDateSort(b.date) - safeDateSort(a.date)
      )
    }));

  const generatePDF = () => {
    const filtered = sortedTrophies.filter(t => {
      const d = safeDate(t.date) || new Date(0);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate + "T23:59:59")) return false;
      return true;
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Hunt Records", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    const dateRange = startDate || endDate
      ? `${startDate || "Start"} to ${endDate || "Present"}`
      : "All Time";
    doc.text(dateRange, pageWidth / 2, 28, { align: "center" });

    const headers = ["Date", "Species", "Name", "Location", "Score"];
    const colWidths = [25, 35, 40, 50, 30];
    const startX = 10;
    let y = 38;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    let x = startX;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });

    doc.setLineWidth(0.3);
    doc.line(startX, y + 2, pageWidth - 10, y + 2);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    filtered.forEach(t => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      x = startX;
      const dateStr = safeDate(t.date)?.toLocaleDateString() || "Unknown";
      const row = [
        dateStr,
        t.species || "",
        (t.name || "").substring(0, 25),
        (t.location || "—").substring(0, 30),
        t.score || "—",
      ];

      row.forEach((cell, i) => {
        doc.text(cell, x, y);
        x += colWidths[i];
      });

      y += 6;
    });

    doc.setFontSize(8);
    doc.text(`Total: ${filtered.length} records`, startX, y + 5);

    doc.save("hunt-records.pdf");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full">
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/trophies">
              <Button variant="ghost" size="sm" className="gap-1.5" data-testid="button-back-trophies">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1" data-testid="text-timeline-heading">Trophy Timeline</h1>
              <p className="text-sm text-muted-foreground">Your hunting journey over time</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowExport(!showExport)}
            data-testid="button-pull-hunt-records"
          >
            <FileText className="h-3.5 w-3.5" />
            Pull Hunt Records
          </Button>
        </header>

        {showExport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-card rounded-lg border border-border/40"
          >
            <p className="text-sm font-medium mb-3">Select date range for PDF export</p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background h-9"
                  data-testid="input-export-start-date"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background h-9"
                  data-testid="input-export-end-date"
                />
              </div>
              <Button size="sm" onClick={generatePDF} className="gap-1.5" data-testid="button-generate-pdf">
                <FileText className="h-3.5 w-3.5" />
                Generate PDF
              </Button>
            </div>
          </motion.div>
        )}

        {sortedTrophies.length > 0 ? (
          <div className="space-y-8">
            {sortedYears.map(({ year, trophies: yearTrophies }) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-serif font-bold text-primary">{year}</span>
                  <div className="flex-1 h-px bg-border/50"></div>
                  <span className="text-xs text-muted-foreground">{yearTrophies.length} {yearTrophies.length === 1 ? "hunt" : "hunts"}</span>
                </div>
                <div className="relative pl-6 md:pl-8 border-l-2 border-primary/20 space-y-4">
                  {yearTrophies.map((trophy, i) => (
                    <TimelineEntry key={trophy.id} trophy={trophy} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-serif text-lg">No trophies yet</p>
            <p className="text-sm mt-1">Upload your first trophy to start your timeline</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function TimelineEntry({ trophy, index }: { trophy: TrophyType; index: number }) {
  const dateStr = safeDate(trophy.date)?.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  }) || "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/trophies/${trophy.id}`}>
        <div className="relative group cursor-pointer">
          <div className="absolute -left-[calc(1.5rem+5px)] md:-left-[calc(2rem+5px)] top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10"></div>

          <Card className="bg-card/80 border-border/30 hover:border-primary/30 transition-colors overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                {trophy.imageUrl ? (
                  <img
                    src={trophy.imageUrl}
                    alt={trophy.species}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shrink-0 border border-border/30"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-border/30">
                    <Trophy className="h-5 w-5 text-primary/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{dateStr}</span>
                    {trophy.featured && <Star className="h-3 w-3 text-primary fill-primary" />}
                  </div>
                  <h4 className="text-sm font-serif font-bold text-foreground truncate">{trophy.species}</h4>
                  {trophy.name && (
                    <p className="text-xs text-muted-foreground truncate">{trophy.name}</p>
                  )}
                </div>
                {trophy.score && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-serif font-bold text-primary">{trophy.score}</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Link>
    </motion.div>
  );
}
