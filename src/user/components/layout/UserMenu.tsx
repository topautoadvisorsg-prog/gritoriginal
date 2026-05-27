import { useAuth } from "@/shared/hooks/use-auth";
import { getCountryFlag } from "@/shared/lib/countries";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Settings, Shield, Loader2, Trophy, UserPlus } from "lucide-react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

export function UserMenu() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="p-2">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <SignInButton mode="modal">
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-login">
            <LogIn className="w-4 h-4" />
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm" className="gap-2" data-testid="button-sign-up">
            <UserPlus className="w-4 h-4" />
            Sign up
          </Button>
        </SignUpButton>
      </div>
    );
  }

  const avatarUrl = (user as any)?.avatarUrl || (user as any)?.profileImageUrl;
  const displayName = (user as any)?.username ||
    `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() ||
    'User';
  const isAdmin = (user as any)?.role === "admin";
  const totalPoints = (user as any)?.totalPoints || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
          <Avatar className="h-9 w-9">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black leading-none display-font italic uppercase tracking-tight truncate">{displayName}</p>
                  <span className="text-sm">
                    {getCountryFlag((user as any)?.country || "")}
                  </span>
                </div>
                <p className="text-[10px] leading-none text-muted-foreground uppercase font-medium truncate mt-1">
                  {(user as any)?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1" title="Intelligence Level">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{totalPoints} pts</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer" data-testid="menu-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/fight-cards" className="cursor-pointer" data-testid="menu-admin-fights">
                <Shield className="mr-2 h-4 w-4" />
                <span>Fight Management</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer" data-testid="menu-logout">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
