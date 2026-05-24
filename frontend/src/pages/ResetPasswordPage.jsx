import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const getStrength = (p) => {
    if (!p) return { score: 0, label: '', color: 'bg-muted' };
    let s = 0;
    if (p.length > 7) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s < 2) return { score: s, label: 'Weak', color: 'bg-destructive' };
    if (s < 4) return { score: s, label: 'Fair', color: 'bg-yellow-500' };
    return { score: s, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | DevInspectAI</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-animated px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="card-glass p-8 sm:p-10">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gradient mb-2">Password Reset!</h2>
                <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2 text-gradient">New Password</h1>
                  <p className="text-muted-foreground text-sm">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-semibold text-sm text-foreground/80">New Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="input-premium pl-12 pr-12 h-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {password && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-full flex-1 ${strength.score >= i ? strength.color : 'bg-transparent'} transition-all`} />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-12 text-right">{strength.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-semibold text-sm text-foreground/80">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="input-premium pl-12 pr-12 h-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                      >
                        <p className="text-sm font-semibold text-destructive">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    className="w-full h-12 btn-primary text-base font-semibold glow-effect"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Resetting...</>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity font-medium">
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
