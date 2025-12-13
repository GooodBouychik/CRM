import { User } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileSelectProps {
  users: User[];
  onSelect: (user: User) => void;
}

const ProfileSelect = ({ users, onSelect }: ProfileSelectProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center animate-fade-in w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-3">
          Team CRM
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-8 sm:mb-12">
          Выбери свой профиль
        </p>

        {/* Grid: 2 columns on mobile, 3 on desktop. Last item centered on mobile */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 sm:px-0">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className={cn(
                "group relative aspect-square sm:w-40 sm:h-44 rounded-2xl bg-card border border-border",
                "hover:border-transparent hover:scale-105 transition-all duration-300",
                "flex flex-col items-center justify-center gap-3",
                "animate-slide-up",
                // Last item spans full width and centers on mobile when odd count
                users.length % 2 === 1 && index === users.length - 1 && "col-span-2 max-w-[50%] mx-auto sm:col-span-1 sm:max-w-none"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient border on hover */}
              <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-b p-[1px]",
                user.color
              )}>
                <div className="w-full h-full rounded-2xl bg-card" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
                  {user.avatar}
                </span>
                <span className="text-foreground font-medium text-base sm:text-lg">
                  {user.name}
                </span>
              </div>

              {/* Bottom accent line */}
              <div className={cn(
                "absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full",
                "bg-gradient-to-r opacity-50 group-hover:opacity-100 group-hover:w-16 transition-all duration-300",
                user.color
              )} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSelect;
