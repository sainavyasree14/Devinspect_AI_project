import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Mail, Lock, User, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { AUTH_GITHUB_URL, AUTH_GOOGLE_URL } from '@/lib/apiConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-muted' };
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 2) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score === 2 || score === 3) return { score, label: 'Fair', color: 'bg-warning' };
    return { score, label: 'Strong', color: 'bg-success' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email || !formData.password || !formData.passwordConfirm) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      await signup(formData.email, formData.password, formData.name);
      toast.success('Account created successfully!');
      navigate('/mode-selection');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Account | DevInspect AI</title>
      </Helmet>

      <div className="min-h-screen flex w-full bg-animated overflow-hidden flex-row-reverse">
        {/* Right Side: Premium Pastel Hero */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-bl from-lavender/30 via-baby-pink/30 to-pastel-blue/30 animate-blob" />
          
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
            className="absolute top-20 right-20 w-64 h-64 bg-lavender/40 rounded-full blur-3xl"
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
            className="absolute bottom-20 left-20 w-80 h-80 bg-baby-pink/40 rounded-full blur-3xl"
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
                right: `${15 + i * 12}%`,
              }}
            />
          ))}

          <div className="absolute inset-0 z-30 p-12 flex flex-col justify-between">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-end gap-4 w-full"
            >
              <div>
                <span className="font-bold text-3xl tracking-tight text-gradient">DevInspect AI</span>
                <p className="text-sm text-muted-foreground/80 mt-1 text-right">Premium Code Analysis</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/40 backdrop-blur-xl flex items-center justify-center border border-white/50 shadow-lg shadow-primary/20">
                <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-lg ml-auto text-right"
            >
              <h2 className="text-5xl font-extrabold mb-6 leading-tight text-gradient">
                Your intelligent coding companion
              </h2>
              <p className="text-lg text-foreground/70 leading-relaxed mb-8">
                Get actionable insights, prepare for technical interviews, and master best practices in minutes with AI-powered code analysis.
              </p>
              <div className="flex gap-4 justify-end">
                <div className="card-glass px-6 py-4">
                  <p className="text-3xl font-bold text-secondary">50+</p>
                  <p className="text-sm text-muted-foreground">Languages</p>
                </div>
                <div className="card-glass px-6 py-4">
                  <p className="text-3xl font-bold text-accent">99%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Left Side: Glassmorphism Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-bl from-cream/50 via-transparent to-lavender/50 opacity-50" />
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
          >
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
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-gradient">Create an account</h1>
                <p className="text-muted-foreground text-base">Start improving your code today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-sm text-foreground/80">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Maya Chen"
                      className="input-premium pl-12 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-sm text-foreground/80">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="input-premium pl-12 h-12"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-sm text-foreground/80">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
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
                  {formData.password && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
                        <div className={`h-full ${strength.score >= 1 ? strength.color : 'bg-transparent'} transition-all`} style={{ width: '25%' }} />
                        <div className={`h-full ${strength.score >= 2 ? strength.color : 'bg-transparent'} transition-all`} style={{ width: '25%' }} />
                        <div className={`h-full ${strength.score >= 3 ? strength.color : 'bg-transparent'} transition-all`} style={{ width: '25%' }} />
                        <div className={`h-full ${strength.score >= 4 ? strength.color : 'bg-transparent'} transition-all`} style={{ width: '25%' }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-12 text-right">{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="font-semibold text-sm text-foreground/80">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="passwordConfirm"
                      name="passwordConfirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      className="input-premium pl-12 pr-12 h-12"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                    className="mt-1 rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer leading-tight">
                    I agree to the <Link to="#" className="text-primary hover:underline font-medium">Terms of Service</Link> and <Link to="#" className="text-primary hover:underline font-medium">Privacy Policy</Link>
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6">
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
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-gradient hover:opacity-80 transition-opacity">
                    Log in
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

export default SignupPage;