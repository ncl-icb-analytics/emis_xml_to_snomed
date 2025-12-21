'use client';

import { useAppMode } from '@/contexts/AppModeContext';
import { Button } from '@/components/ui/button';
import { FolderTree, Package } from 'lucide-react';

export default function ModeToggle() {
  const { mode, setMode } = useAppMode();

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-md">
      <Button
        variant={mode === 'explore' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('explore')}
        className="flex-1 gap-2"
      >
        <FolderTree className="h-4 w-4" />
        <span className="hidden sm:inline">Explore</span>
      </Button>
      <Button
        variant={mode === 'extract' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('extract')}
        className="flex-1 gap-2"
      >
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Extract</span>
      </Button>
    </div>
  );
}
