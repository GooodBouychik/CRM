import { useState } from "react";
import { OrderHeader } from "@/components/order/OrderHeader";
import { OrderSidebar } from "@/components/order/OrderSidebar";
import { KanbanBoard } from "@/components/order/KanbanBoard";
import { CommentsSection } from "@/components/order/CommentsSection";
import { MobileOrderView } from "@/components/order/MobileOrderView";
import { useIsMobile } from "@/hooks/use-mobile";

export default function OrderEdit() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileOrderView />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OrderHeader 
        orderNumber="006" 
        orderTitle="Autu-match" 
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <OrderSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 p-6 overflow-auto">
            <KanbanBoard />
          </div>
          <CommentsSection />
        </main>
      </div>
    </div>
  );
}
