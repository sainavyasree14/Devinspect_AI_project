import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PasswordResetPage = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | DevInspectAI</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-animated px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="card-glass p-8 sm:p-10">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gradient mb-2">Check your inbox</h2>
                <p className="text-muted-foreground text-sm mb-1">
                  We sent a reset link to
                </p>
                <p className="font-semibold text-foreground text-sm mb-6">{email}</p>
                <p className="text-xs text-muted-foreground mb-6">
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>
                <Button
                  onClick={() => { setSent(false); setEmail(''); }}
                  variant="outline"
                  className="w-full border-border/50"
                >
                  Send again
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2 text-gradient">Forgot Password?</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your email and we'll send you a reset link
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold text-sm text-foreground/80">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="input-premium pl-12 h-12"
                        disabled={loading}
                        autoComplete="email"
                      />
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
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Sending...</>
                    ) : (
                      'Send Reset Link'
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

export default PasswordResetPage;
