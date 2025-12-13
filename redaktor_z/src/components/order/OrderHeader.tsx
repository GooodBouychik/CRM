import { ChevronLeft, ChevronDown, Trash2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrderHeaderProps {
  orderNumber: string;
  orderTitle: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function OrderHeader({ orderNumber, orderTitle, isSidebarOpen, onToggleSidebar }: OrderHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <span className="text-muted-foreground text-sm font-mono">#{orderNumber}</span>
          <h1 className="text-xl font-mono font-semibold text-foreground">{orderTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-status-active text-status-active-foreground border-0 hover:bg-status-active/90 hover:text-status-active-foreground gap-2 font-medium"
            >
              В работе
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem>Новый</DropdownMenuItem>
            <DropdownMenuItem>В работе</DropdownMenuItem>
            <DropdownMenuItem>На паузе</DropdownMenuItem>
            <DropdownMenuItem>Завершён</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-priority-high text-priority-high-foreground border-0 hover:bg-priority-high/90 hover:text-priority-high-foreground gap-2 font-medium"
            >
              Высокий
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem className="text-priority-low">Низкий</DropdownMenuItem>
            <DropdownMenuItem className="text-priority-medium">Средний</DropdownMenuItem>
            <DropdownMenuItem className="text-priority-high">Высокий</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete button */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
