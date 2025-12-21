'use client';

import { useAppMode } from '@/contexts/AppModeContext';
import ExploreMode from '@/components/explore-mode';
import BatchExtractor from '@/components/batch-extractor';

export default function HomePage() {
  const { mode } = useAppMode();

  // Render the appropriate mode component
  return mode === 'extract' ? <BatchExtractor /> : <ExploreMode />;
}
