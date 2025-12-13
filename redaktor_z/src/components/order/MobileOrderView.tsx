import { useState } from "react";
import { ChevronLeft, MoreVertical, FileText, MessageSquare, LayoutGrid, ChevronDown, Plus, Send, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TabType = "details" | "tasks" | "comments";

const teamMembers = [
  { id: "nikita", name: "Никита", checked: true },
  { id: "sanya", name: "Саня", checked: true },
  { id: "ksyusha", name: "Ксюша", checked: true },
];

const columns = [
  { id: "planning", title: "Планирование", count: 0, color: "bg-blue-500" },
  { id: "development", title: "Разработка", count: 0, color: "bg-purple-500" },
  { id: "testing", title: "Проверка", count: 0, color: "bg-orange-500" },
  { id: "done", title: "Завершено", count: 0, color: "bg-green-500" },
];

const comments = [
  {
    id: "1",
    author: "Никита",
    action: "изменил(а) исполнители: (пусто) → Никита",
    timestamp: "13 дек., 15:55",
  },
];

export function MobileOrderView() {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [activeColumn, setActiveColumn] = useState(0);
  const [commentText, setCommentText] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-muted-foreground text-xs font-mono">#006</p>
              <h1 className="text-lg font-mono font-bold">Autu-match</h1>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem className="text-destructive">Удалить заказ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badges */}
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                В работе
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              <DropdownMenuItem>Новый</DropdownMenuItem>
              <DropdownMenuItem>В работе</DropdownMenuItem>
              <DropdownMenuItem>На паузе</DropdownMenuItem>
              <DropdownMenuItem>Завершён</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-sm font-medium">
                Высокий
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-border">
              <DropdownMenuItem>Низкий</DropdownMenuItem>
              <DropdownMenuItem>Средний</DropdownMenuItem>
              <DropdownMenuItem>Высокий</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[106px] z-40 bg-card border-b border-border">
        <div className="flex">
          {[
            { id: "details" as TabType, icon: FileText, label: "Детали" },
            { id: "tasks" as TabType, icon: LayoutGrid, label: "Задачи" },
            { id: "comments" as TabType, icon: MessageSquare, label: "Чат" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
                ${activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === "details" && (
          <div className="p-4 space-y-5">
            {/* Client */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Клиент</Label>
              <Input defaultValue="Эльмар" className="bg-secondary border-0 h-11" />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Сумма</Label>
              <div className="relative">
                <Input defaultValue="150000" className="bg-secondary border-0 h-11 pr-10" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">₽</span>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Дедлайн</Label>
              <div className="relative">
                <Input defaultValue="01.01.2026" className="bg-secondary border-0 h-11 pr-12" />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Team */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Команда</Label>
              <div className="bg-secondary rounded-lg p-3 space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={member.id} 
                      defaultChecked={member.checked}
                      className="w-5 h-5 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor={member.id} className="text-sm flex-1">{member.name}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional field */}
            <div className="space-y-2">
              <Label className="text-sm">
                Заказ от Ксюши? <span className="text-destructive">*</span>
              </Label>
              <Select defaultValue="no">
                <SelectTrigger className="bg-secondary border-0 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="yes">Да</SelectItem>
                  <SelectItem value="no">Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Описание</Label>
              <Textarea 
                placeholder="Добавьте описание..."
                className="bg-secondary border-0 min-h-[100px] resize-none"
              />
            </div>

            {/* Files */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Файлы</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center active:bg-secondary transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Нажмите для загрузки</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="h-full flex flex-col">
            {/* Column tabs */}
            <div className="flex overflow-x-auto scrollbar-thin border-b border-border bg-card">
              {columns.map((col, idx) => (
                <button
                  key={col.id}
                  onClick={() => setActiveColumn(idx)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative
                    ${activeColumn === idx ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    {col.title}
                    <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {col.count}
                    </span>
                  </span>
                  {activeColumn === idx && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Tasks content */}
            <div className="flex-1 p-4">
              <div className="bg-secondary/50 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-center mb-4">Нет подзадач</p>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить задачу
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="flex flex-col h-full">
            {/* Comments list */}
            <div className="flex-1 p-4 space-y-4 overflow-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-9 h-9 bg-muted shrink-0">
                    <AvatarFallback className="text-sm bg-muted text-muted-foreground">
                      {comment.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-secondary rounded-2xl rounded-tl-md p-3">
                    <p className="text-sm font-medium mb-0.5">{comment.author}</p>
                    <p className="text-sm text-muted-foreground">{comment.action}</p>
                    <p className="text-xs text-muted-foreground mt-2">{comment.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="sticky bottom-0 p-4 bg-card border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Напишите комментарий..."
                  className="flex-1 bg-secondary border-0 h-11"
                />
                <Button size="icon" className="h-11 w-11 shrink-0">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
