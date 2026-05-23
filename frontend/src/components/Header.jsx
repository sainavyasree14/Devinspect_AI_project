import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Settings, LogOut, Menu, X, Sparkles, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar.jsx';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const Header = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { currentUser, currentMode, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  const getModeStyles = (mode) => {
    switch (mode) {
      case 'student':     return 'bg-baby-pink/20 text-baby-pink border-baby-pink/30';
      case 'interviewer': return 'bg-lavender/20 text-lavender border-lavender/30';
      case 'developer':   return 'bg-pastel-blue/20 text-pastel-blue border-pastel-blue/30';
      default:            return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getModeLabel = (mode) => {
    if (!mode) return '';
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const navLinks = [
    { path: '/dashboard', label: t('nav.dashboard') },
    { path: '/analyzer',  label: t('nav.analyzer') },
    { path: '/history',   label: t('nav.history') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-primary/10 hover:text-primary transition-colors rounded-xl"
            onClick={onMenuToggle}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </motion.div>
            <span className="font-bold text-xl hidden sm:inline tracking-tight text-gradient">DevInspectAI</span>
          </Link>
          
          {currentMode && (
            <Badge className={`${getModeStyles(currentMode)} hidden md:inline-flex px-3 py-1 text-xs uppercase tracking-wider font-bold backdrop-blur-sm`}>
              {getModeLabel(currentMode)}
            </Badge>
          )}

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  location.pathname.startsWith(link.path)
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all glow-effect">
                <UserAvatar user={currentUser} size="md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-border/30 shadow-xl glass">
              <div className="px-3 py-2.5 border-b border-border/30">
                <p className="text-sm font-bold truncate">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                <Link to="/profile" className="flex items-center w-full px-2 py-2">
                  <User className="mr-3 h-4 w-4" />
                  {t('nav.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary">
                <Link to="/settings" className="flex items-center w-full px-2 py-2">
                  <Settings className="mr-3 h-4 w-4" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/30" />
              <DropdownMenuItem onClick={logout} className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-3 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;