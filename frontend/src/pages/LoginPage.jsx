import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Mail, Lock, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AUTH_GITHUB_URL, AUTH_GOOGLE_URL } from '@/lib/apiConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show OAuth error if redirected back with error param
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError === 'oauth_failed') {
      setError('Sign-in failed. Please try again or use email login.');
    } else if (oauthError === 'google_not_configured') {
      setError('Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env');
    } else if (oauthError === 'github_not_configured') {
      setError('GitHub OAuth is not configured. Add your GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend .env — get them at github.com/settings/developers');
    } else if (oauthError === 'google_failed') {
      setError('Google sign-in was cancelled or failed. Please try again.');
    } else if (oauthError === 'github_failed') {
      setError('GitHub sign-in was cancelled or failed. Please try again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | DevInspectAI</title>
      </Helmet>

      <div className="min-h-screen flex w-full bg-animated overflow-hidden">
        {/* Left Side: Premium Pastel Hero */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-baby-pink/30 via-lavender/30 to-pastel-blue/30 animate-blob" />
          
          {/* Floating Glowing Blobs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-baby-pink/40 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-20 right-20 w-80 h-80 bg-lavender/40 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pastel-blue/30 rounded-full blur-3xl"
          />

          {/* Animated Sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                top: `${20 + i * 15}%`,
                left: `${15 + i * 12}%`,
              }}
            />
          ))}

          {/* Branding Content */}
          <div className="absolute inset-0 z-30 p-12 flex flex-col justify-between">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-xl flex items-center justify-center border border-white/50 shadow-lg shadow-primary/20">
                <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              </div>
              <div>
               <span className="font-bold text-3xl tracking-tight text-gradient">DevInspectAI</span>
                <p className="text-sm text-muted-foreground/80 mt-1">Premium Code Analysis</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-lg"
            >
              <h2 className="text-5xl font-extrabold mb-6 leading-tight text-gradient">
                Elevate your code quality instantly
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                Join thousands of developers automating their code reviews, finding bugs faster, and preparing for technical interviews with AI-powered insights.
              </p>
              <div className="flex gap-4">
                <div className="card-glass px-6 py-4">
                  <p className="text-3xl font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="card-glass px-6 py-4">
                  <p className="text-3xl font-bold text-secondary">1M+</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-cream/50 via-transparent to-lavender/50 opacity-50" />
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
          >
            {/* Glass Card */}
            <div className="card-glass p-8 sm:p-10">
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-gradient">Welcome back</h1>
                <p className="text-muted-foreground text-base">Enter your details to access your account</p>
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-semibold text-sm text-foreground/80">Password</Label>
                    <Link
                      to="/password-reset"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-premium pl-12 pr-12 h-12"
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox id="remember" className="rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Social Login */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background/80 backdrop-blur-sm text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Button onClick={() => window.location.href = AUTH_GITHUB_URL} variant="outline" className="h-12 border-border/50 hover:bg-muted/50 hover:border-border transition-all">
                    <Github className="mr-2 h-5 w-5" />
                    GitHub
                  </Button>
                  <Button onClick={() => window.location.href = AUTH_GOOGLE_URL} variant="outline" className="h-12 border-border/50 hover:bg-muted/50 hover:border-border transition-all">
                    <Chrome className="mr-2 h-5 w-5" />
                    Google
                  </Button>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-bold text-gradient hover:opacity-80 transition-opacity">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;