import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Calendar, Trash2, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import AvatarUpload from '@/components/AvatarUpload.jsx';
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
import { toast } from 'sonner';
import { getReviewsFromServer } from '@/lib/historyStorage';

const ProfilePage = () => {
  const { currentUser, logout, deleteAccountOnBackend } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 0, avgScore: 100, topLang: '—' });
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || localStorage.getItem('devinspect-avatar') || '');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const reviews = await getReviewsFromServer();
        const scoreSum = reviews.reduce((sum, r) => sum + (r.aiScore || 100), 0);
        const avg = reviews.length ? Math.round(scoreSum / reviews.length) : 100;
        
        const languageCounts = reviews.reduce((acc, review) => {
          const lang = (review.language || "unknown").toLowerCase();
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {});

        const topLanguage =
          Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

        setStats({
          total: reviews.length,
          avgScore: avg,
          topLang: topLanguage
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccountOnBackend();
      toast.success('Account deleted successfully.');
      logout();
    } catch (err) {
      toast.error('Failed to delete account.');
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  return (
    <>
      <Helmet><title>My Profile | DevInspect AI</title></Helmet>
      <div className="w-full min-h-screen py-12 px-4 flex justify-center text-foreground bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="card-glass rounded-3xl relative overflow-hidden p-0 border border-border/30">
            {/* Header Cover */}
            <div className="h-40 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
            
            <div className="px-8 pb-8">
              {/* Avatar Upload */}
              <div className="relative -mt-20 mb-6 flex justify-between items-end">
                <div className="flex flex-col items-start gap-3">
                  <AvatarUpload
                    currentAvatar={avatarUrl}
                    userName={currentUser?.name}
                    onAvatarUpdate={setAvatarUrl}
                  />
                </div>
                <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary capitalize">
                  Role: {currentUser?.role || 'Developer'}
                </div>
              </div>
 
              {/* Info */}
              <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 text-gradient">{currentUser?.name || 'Developer'}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-muted-foreground text-sm font-medium">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {currentUser?.email}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-secondary" /> Joined {currentUser?.created ? new Date(currentUser.created).toLocaleDateString() : 'Recently'}</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="card-glass p-4 rounded-2xl border border-border/20 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Reviews</p>
                  <p className="text-2xl font-black text-gradient">{stats.total}</p>
                </div>
                <div className="card-glass p-4 rounded-2xl border border-border/20 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Score</p>
                  <p className="text-2xl font-black text-gradient">{stats.avgScore}%</p>
                </div>
                <div className="card-glass p-4 rounded-2xl border border-border/20 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Top Lang</p>
                  <p className="text-2xl font-black text-gradient">{stats.topLang.toUpperCase()}</p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-destructive/30">
                <h3 className="text-lg font-bold text-destructive mb-1">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">Once you delete your account, all review history and preferences will be permanently wiped.</p>
                <Button variant="destructive" onClick={() => setDeleteDialog(true)} className="font-bold rounded-xl h-11 px-6">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent className="border-destructive/30 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive font-bold text-lg">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your developer account and remove your history from our database servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                {deleting ? 'Deleting...' : 'Yes, delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ProfilePage;