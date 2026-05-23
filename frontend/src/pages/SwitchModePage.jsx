// Using ModeSelectionPage as base since they are nearly identical structurally per request, but with an AlertDialog
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Code2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { normalizeMode } from '@/lib/historyStorage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SwitchModePage = () => {
  const navigate = useNavigate();
  const { currentMode, switchMode } = useAuth();
  const [pendingMode, setPendingMode] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const modes = [
    {
      id: 'student',
      name: 'Student',
      icon: GraduationCap,
      description: 'Learn and improve with detailed explanations.',
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary'
    },
    {
      id: 'interviewer',
      name: 'Interviewer',
      icon: Users,
      description: 'Generate questions and assess candidates.',
      color: 'secondary',
      bgClass: 'bg-secondary/10',
      textClass: 'text-secondary'
    },
    {
      id: 'developer',
      name: 'Developer',
      icon: Code2,
      description: 'Advanced analysis and performance profiling.',
      color: 'accent',
      bgClass: 'bg-accent/10',
      textClass: 'text-accent'
    },
  ];

  const handleSelect = (id) => {
    if (normalizeMode(id) === normalizeMode(currentMode)) {
      toast.info('You are already in this mode.');
      return;
    }
    setPendingMode(id);
    setShowConfirm(true);
  };

  const executeSwitch = async () => {
    setLoading(true);
    try {
      await switchMode(pendingMode);
      toast.success('Workspace switched successfully!');
      setShowConfirm(false);
      navigate('/analyzer');
    } catch (error) {
      toast.error('Failed to switch workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Switch Workspace | DevInspectAI</title></Helmet>
      <div className="w-full min-h-screen py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Switch Workspace</h1>
            <p className="text-muted-foreground">Change your current operating mode to access different tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modes.map((mode, index) => {
              const Icon = mode.icon;
              const isActive = normalizeMode(currentMode) === mode.id;

              return (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`card-elevated relative flex flex-col justify-between h-full border-2 transition-all ${isActive ? `border-${mode.color} shadow-md` : 'border-transparent hover:border-border/80'}`}
                >
                  {isActive && (
                    <div className={`absolute -top-3 -right-3 ${mode.bgClass} ${mode.textClass} rounded-full p-1`}>
                      <CheckCircle2 className="w-6 h-6 fill-current text-white" />
                    </div>
                  )}
                  
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${mode.bgClass} flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 ${mode.textClass}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{mode.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{mode.description}</p>
                  </div>

                  <Button 
                    variant={isActive ? "outline" : "default"} 
                    className={`w-full ${!isActive && 'btn-primary'}`}
                    onClick={() => handleSelect(mode.id)}
                    disabled={isActive}
                  >
                    {isActive ? 'Current Active' : `Switch to ${mode.name}`}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Change Workspace?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to switch to the <strong>{modes.find(m=>m.id===pendingMode)?.name}</strong> workspace. This will change the tools and analysis metrics available to you.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeSwitch} disabled={loading} className="bg-primary text-primary-foreground hover:brightness-110">
                {loading ? 'Switching...' : 'Yes, Switch Now'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default SwitchModePage;