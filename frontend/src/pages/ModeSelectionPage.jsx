import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Code2, CheckCircle2, Loader2, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
const ModeSelectionPage = () => {
  const navigate = useNavigate();
  const { currentMode, switchMode, currentUser } = useAuth();
  
  // (1) Add state for selectedMode, isLoading, and error
  const [selectedMode, setSelectedMode] = useState(currentMode || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // (4) Ensure the mode selection persists from the user profile data
  useEffect(() => {
    if (currentUser?.currentMode) {
      setSelectedMode(currentUser.currentMode);
    } else if (currentMode) {
      setSelectedMode(currentMode);
    }
  }, [currentUser, currentMode]);

  const modes = [
    {
      id: 'student',
      name: 'Student',
      icon: GraduationCap,
      description: 'Learn and improve with detailed explanations, best practices, and bug fixes.',
      image: 'https://images.unsplash.com/photo-1650278795309-26295c74cf2b?q=80&w=800&auto=format&fit=crop',
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      ringClass: 'ring-primary'
    },
    {
      id: 'interviewer',
      name: 'Interviewer',
      icon: Users,
      description: 'Generate technical questions and assess code comprehension from snippets.',
      image: 'https://images.unsplash.com/photo-1631706931923-5b95f259166d?q=80&w=800&auto=format&fit=crop',
      color: 'secondary',
      bgClass: 'bg-secondary/10',
      textClass: 'text-secondary',
      ringClass: 'ring-secondary'
    },
    {
      id: 'developer',
      name: 'Developer',
      icon: Code2,
      description: 'Advanced analysis, performance profiling, and side-by-side refactoring diffs.',
      image: 'https://images.unsplash.com/photo-1489506020498-e6c1cc350f10?q=80&w=1200&auto=format&fit=crop',
      color: 'accent',
      bgClass: 'bg-accent/10',
      textClass: 'text-accent',
      ringClass: 'ring-accent',
      isWide: true
    },
  ];

  // (2) Create handleModeSelect function
  const handleModeSelect = async () => {
    if (!selectedMode) {
      toast.error('Please select a workspace mode to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // (5) Add console logging to debug the save process
    console.log('Initiating mode save...', {
      userId: currentUser?.id,
      selectedMode: selectedMode
    });

    try {
      // Calls context method which saves to user_modes and users collections
      await switchMode(selectedMode);
      
      console.log('Mode saved successfully to backend.');
      
      // Briefly show success before navigation
      toast.success('Workspace mode saved successfully!', { duration: 2000 });
      
      // (7) Ensure navigation happens AFTER database save completes
      navigate('/analyzer');
    } catch (err) {
      // (3) Add error handling with user-friendly error messages
      console.error('Failed to save mode selection:', err);
      setError(err.message || 'An error occurred while saving your workspace mode.');
      toast.error('Failed to save mode selection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Select Workspace Mode | DevInspectAI</title>
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Choose your workspace</h1>
          <p className="text-lg text-muted-foreground">Select a mode tailored to your current goal. You can always change this later in settings.</p>
        </motion.div>

        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`
                    relative group cursor-pointer overflow-hidden rounded-3xl border-2 transition-all duration-300
                    ${isSelected ? `border-${mode.color} shadow-lg shadow-${mode.color}/20 scale-[1.02]` : 'border-border/50 hover:border-border hover:shadow-xl hover:scale-[1.01]'}
                    ${mode.isWide ? 'md:col-span-2' : ''}
                  `}
                  onClick={() => !isLoading && setSelectedMode(mode.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 ${isSelected ? 'opacity-90' : 'opacity-100'}`} />
                  <img 
                    src={mode.image} 
                    alt={`${mode.name} mode background`}
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  <div className="relative z-20 p-8 h-full flex flex-col justify-end min-h-[280px]">
                    {isSelected && (
                      <div className={`absolute top-6 right-6 ${mode.textClass} animate-scale-in`}>
                        <CheckCircle2 className="w-8 h-8 fill-current text-white" />
                      </div>
                    )}
                    
                    <div className={`w-14 h-14 rounded-2xl ${mode.bgClass} flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10`}>
                      <Icon className={`w-7 h-7 ${mode.textClass}`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2 text-foreground">{mode.name} Mode</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-md">{mode.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center max-w-md mx-auto"
          >
            {/* (3) Error box with a retry button */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 w-full p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleModeSelect} 
                  disabled={isLoading}
                  className="border-destructive/30 hover:bg-destructive/20 text-destructive shrink-0"
                >
                  <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </motion.div>
            )}

            {/* (6) Update the Confirm Selection button to show loading state */}
            <Button
              size="lg"
              className="btn-primary text-lg px-12 h-14 min-w-[240px] w-full sm:w-auto"
              onClick={handleModeSelect}
              disabled={!selectedMode || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Mode...
                </>
              ) : (
                'Confirm Selection'
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ModeSelectionPage;