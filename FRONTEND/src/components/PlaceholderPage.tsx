import { cn } from '@/lib/utils';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  icon?: React.ElementType;
}

const PlaceholderPage = ({ title, icon: Icon = Construction }: PlaceholderPageProps) => {
  return (
    <div className="p-4 lg:p-6 animate-fade-in">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">
          Раздел в разработке
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
