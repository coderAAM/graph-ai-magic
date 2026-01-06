import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ChatPanel } from './ChatPanel';

interface MobileChatDrawerProps {
  onGraphCommand: (command: string) => void;
  isProcessing: boolean;
}

export const MobileChatDrawer = ({ onGraphCommand, isProcessing }: MobileChatDrawerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="glow"
          size="lg"
          className="fixed bottom-6 right-6 z-50 sm:hidden rounded-full w-14 h-14 p-0 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] glass-panel-strong">
        <ChatPanel
          onGraphCommand={(cmd) => {
            onGraphCommand(cmd);
            // Keep drawer open while processing
          }}
          isProcessing={isProcessing}
        />
      </DrawerContent>
    </Drawer>
  );
};
