'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Download } from 'lucide-react';
import { formatTime } from '@/lib/time-utils';

interface ProcessingStatusProps {
  currentReport: number;
  totalReports: number;
  reportName: string;
  currentValueSet: number;
  totalValueSets: number;
  message: string;
  progress: number;
  elapsedTime: number;
  remainingTime: number | null;
  onCancel: () => void;
}

export function ProcessingStatusCard({
  currentReport,
  totalReports,
  reportName,
  message,
  progress,
  elapsedTime,
  remainingTime,
  onCancel,
}: ProcessingStatusProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Extracting Reports</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Report {currentReport} of {totalReports}: {reportName}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              className="gap-2 flex-shrink-0"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Overall Progress</span>
              <span className="text-xs font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Elapsed: {formatTime(elapsedTime)}</span>
              {remainingTime !== null && <span>Remaining: {formatTime(remainingTime)}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CompletedStatusProps {
  reportCount: number;
  totalTime: number | null;
  stats: {
    reports: number;
    valuesets: number;
    expandedConcepts: number;
    originalCodes: number;
    failedCodes: number;
    exceptions: number;
  };
  onDownload: () => void;
}

export function CompletedStatusCard({
  reportCount,
  totalTime,
  stats,
  onDownload,
}: CompletedStatusProps) {
  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Extraction Complete
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Successfully processed {reportCount} reports
                {totalTime !== null && totalTime >= 0 && <> in {formatTime(totalTime)}</>}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">Reports</div>
              <div className="font-semibold">{stats.reports}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">ValueSets</div>
              <div className="font-semibold">{stats.valuesets}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">Expanded Concepts</div>
              <div className="font-semibold">{stats.expandedConcepts}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">Original Codes</div>
              <div className="font-semibold">{stats.originalCodes}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">Failed Codes</div>
              <div className="font-semibold">{stats.failedCodes}</div>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded">
              <div className="text-xs text-muted-foreground">Exceptions</div>
              <div className="font-semibold">{stats.exceptions}</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onDownload} variant="default">
              <Download className="mr-2 h-4 w-4" />
              Download ZIP Bundle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorStatusProps {
  errorMessage?: string;
}

export function ErrorStatusCard({ errorMessage }: ErrorStatusProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive mb-1">Extraction Failed</h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage || 'An error occurred while processing the reports. Please try again.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
