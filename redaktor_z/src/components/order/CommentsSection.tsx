import { useState } from "react";
import { ArrowDownUp, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const comments = [
  {
    id: "1",
    author: "Никита",
    action: "изменил(а) исполнители: (пусто) → Никита",
    timestamp: "13 дек., 15:55",
    isSystem: true,
  },
];

export function CommentsSection() {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [comment, setComment] = useState("");

  return (
    <div className="border-t border-border">
      {/* Comments header */}
      <div className="flex items-center justify-between px-6 py-3">
        <span className="text-muted-foreground text-sm">
          {comments.length} комментария
        </span>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
          <ArrowDownUp className="w-4 h-4" />
          Сначала старые
        </Button>
      </div>

      {/* Comments list */}
      <div className="px-6 space-y-4 max-h-[200px] overflow-y-auto scrollbar-thin">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 animate-fade-in">
            <Avatar className="w-8 h-8 bg-muted">
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {comment.isSystem ? "⏱" : comment.author[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{comment.author}</span>{" "}
                <span className="text-muted-foreground">{comment.action}</span>
              </p>
              <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="p-6 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("write")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "write" 
                ? "bg-secondary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Написать
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "preview" 
                ? "bg-secondary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Предпросмотр
          </button>
        </div>

        <div className="relative">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите комментарий... (Ctrl+Enter для отправки)"
            className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary min-h-[80px] resize-none pr-12"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Paperclip className="w-4 h-4" />
            <span>Markdown: **жирный**, *курсив*, `код` | @упоминание</span>
          </div>
          <Button size="sm" className="gap-2">
            Отправить
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
