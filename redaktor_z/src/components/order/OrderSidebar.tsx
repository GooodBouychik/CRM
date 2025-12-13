import { Calendar, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const teamMembers = [
  { id: "nikita", name: "Никита", checked: true },
  { id: "sanya", name: "Саня", checked: true },
  { id: "ksyusha", name: "Ксюша", checked: true },
];

interface OrderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderSidebar({ isOpen, onClose }: OrderSidebarProps) {
  return (
    <aside className="w-[380px] min-w-[380px] border-r border-border bg-sidebar p-6 overflow-y-auto scrollbar-thin">
      <div className="space-y-6">
        {/* Client */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Клиент</Label>
          <Input 
            defaultValue="Эльмар" 
            className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Сумма</Label>
          <div className="relative">
            <Input 
              defaultValue="150000" 
              className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₽</span>
          </div>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Дедлайн</Label>
          <div className="relative">
            <Input 
              defaultValue="01.01.2026" 
              className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Team */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Кто работает</Label>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Checkbox 
                  id={member.id} 
                  defaultChecked={member.checked}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label 
                  htmlFor={member.id} 
                  className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
                >
                  {member.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Теги</Label>
          <p className="text-muted-foreground text-sm">Нет тегов</p>
        </div>

        {/* Additional fields */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Дополнительные поля</Label>
          <div className="space-y-2">
            <Label className="text-sm">
              Заказ от Ксюши? <span className="text-destructive">*</span>
            </Label>
            <Select defaultValue="no">
              <SelectTrigger className="bg-secondary border-0 focus:ring-1 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="yes">Да</SelectItem>
                <SelectItem value="no">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Описание (Markdown)</Label>
          <Textarea 
            placeholder="Добавьте описание... (поддерживается Markdown: **жирный**, *курсив*, `код`, списки)"
            className="bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary min-h-[100px] resize-none"
          />
        </div>

        {/* Files */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Файлы</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors cursor-pointer group">
            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" />
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Перетащите файлы сюда или выберите
            </p>
          </div>
          <p className="text-muted-foreground text-sm text-center">Нет прикреплённых файлов</p>
        </div>
      </div>
    </aside>
  );
}
