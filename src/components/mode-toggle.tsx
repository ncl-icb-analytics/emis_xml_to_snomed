'use client';

import { useAppMode } from '@/contexts/AppModeContext';
import { Button } from '@/components/ui/button';
import { FolderTree, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ModeToggle() {
  const { mode, setMode, isExtracting } = useAppMode();
  const { toast } = useToast();

  const handleModeChange = (newMode: 'explore' | 'extract') => {
    if (isExtracting && newMode !== mode) {
      toast({
        title: 'Extraction in progress',
        description: 'Please wait for the extraction to complete or cancel it before switching modes.',
        variant: 'destructive',
      });
      return;
    }
    setMode(newMode);
  };

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-md">
      <Button
        variant={mode === 'explore' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('explore')}
        className="flex-1 gap-2"
        disabled={isExtracting && mode !== 'explore'}
      >
        <FolderTree className="h-4 w-4" />
        <span className="hidden sm:inline">Explore</span>
      </Button>
      <Button
        variant={mode === 'extract' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('extract')}
        className="flex-1 gap-2"
        disabled={isExtracting && mode !== 'extract'}
      >
        <Package className="h-4 w-4" />
        <span className="hidden sm:inline">Extract</span>
      </Button>
    </div>
  );
}
