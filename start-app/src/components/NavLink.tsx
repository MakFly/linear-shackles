import { Link, useRouterState } from "@tanstack/react-router";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string;
  children: ReactNode;
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, end, ...props }, ref) => {
    const router = useRouterState();
    const isActive = end 
      ? router.location.pathname === to
      : router.location.pathname.startsWith(to);
    const isPending = false; // TanStack Router doesn't expose pending state the same way
    
    return (
      <Link
        ref={ref}
        to={to}
        className={cn(
          "px-3 py-1.5 transition-colors",
          isActive 
            ? "text-foreground border-b-2 border-primary" 
            : "text-muted-foreground hover:text-foreground",
          className,
          isActive && activeClassName,
          isPending && pendingClassName
        )}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
