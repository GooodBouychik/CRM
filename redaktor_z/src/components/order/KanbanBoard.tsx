import { KanbanColumn } from "./KanbanColumn";

const columns = [
  { id: "planning", title: "Планирование", count: 0 },
  { id: "development", title: "Разработка", count: 0 },
  { id: "testing", title: "Проверка", count: 0 },
  { id: "done", title: "Завершено", count: 0 },
  { id: "archive", title: "Архив", count: 0 },
];

export function KanbanBoard() {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4">
      {columns.map((column) => (
        <KanbanColumn 
          key={column.id}
          title={column.title}
          count={column.count}
        />
      ))}
    </div>
  );
}
