import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  title: string;
  count: number;
  tasks?: Array<{ id: string; title: string }>;
}

export function KanbanColumn({ title, count, tasks = [] }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[240px] max-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-mono font-medium text-sm text-foreground">{title}</h3>
          <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-kanban-planning rounded-lg p-4 min-h-[300px] space-y-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Нет подзадач</p>
            <button className="text-primary text-sm mt-2 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Добавить подзадачу
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id}
              className="bg-secondary p-3 rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <p className="text-sm text-foreground">{task.title}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
