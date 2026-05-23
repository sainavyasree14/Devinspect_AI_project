import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Copy, UserPlus, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { API_ORIGIN } from '@/lib/apiConfig';

// Lazy-load socket.io only when collaboration is opened
let io = null;

const CollaborationRoom = ({ isOpen, onClose, code, onCodeChange, userName }) => {
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const connectSocket = useCallback(async () => {
    if (socketRef.current?.connected) return;
    try {
      if (!io) {
        const { default: socketIO } = await import('socket.io-client');
        io = socketIO;
      }
      const socket = io(API_ORIGIN, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => { setConnected(false); setInRoom(false); });

      socket.on('room:users', (users) => setActiveUsers(users));
      socket.on('code:update', ({ code: newCode, from }) => {
        if (from !== socket.id) onCodeChange?.(newCode);
      });
      socket.on('user:typing', ({ userName: name, isTyping }) => {
        setTypingUsers(prev =>
          isTyping ? [...new Set([...prev, name])] : prev.filter(u => u !== name)
        );
      });
    } catch {
      setConnected(false);
    }
  }, [onCodeChange]);

  useEffect(() => {
    if (isOpen) connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, connectSocket]);

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    socketRef.current?.emit('room:join', { roomId: id, userName });
    setInRoom(true);
    toast.success(`Room ${id} created!`);
  };

  const joinRoom = () => {
    if (!joinRoomId.trim()) return;
    const id = joinRoomId.trim().toUpperCase();
    setRoomId(id);
    socketRef.current?.emit('room:join', { roomId: id, userName });
    setInRoom(true);
    toast.success(`Joined room ${id}!`);
  };

  const leaveRoom = () => {
    socketRef.current?.emit('room:leave', { roomId });
    setInRoom(false);
    setRoomId('');
    setActiveUsers([]);
  };

  // Broadcast code changes
  useEffect(() => {
    if (!inRoom || !socketRef.current?.connected) return;
    socketRef.current.emit('code:change', { roomId, code, from: socketRef.current.id });

    // Typing indicator
    socketRef.current.emit('user:typing', { roomId, userName, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('user:typing', { roomId, userName, isTyping: false });
    }, 1500);
  }, [code, inRoom, roomId, userName]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-glass w-full max-w-md p-6 rounded-3xl border border-border/30 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Collaboration Room</h3>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!connected && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/20 mb-4 text-sm text-muted-foreground">
              <WifiOff className="w-4 h-4" />
              Connecting to collaboration server...
            </div>
          )}

          {!inRoom ? (
            <div className="space-y-4">
              <Button onClick={createRoom} disabled={!connected} className="w-full btn-primary rounded-xl font-bold h-11">
                <UserPlus className="w-4 h-4 mr-2" /> Create New Room
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border/30" />
                <span>or join existing</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>
              <div className="flex gap-2">
                <Input
                  value={joinRoomId}
                  onChange={e => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter Room ID"
                  className="input-premium h-11 font-mono uppercase"
                  maxLength={6}
                />
                <Button onClick={joinRoom} disabled={!connected || !joinRoomId.trim()} className="btn-secondary h-11 px-4 rounded-xl font-bold">
                  Join
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">Room ID</p>
                  <p className="font-mono font-bold text-primary text-lg">{roomId}</p>
                </div>
                <Button variant="outline" size="icon" onClick={copyRoomId} className="h-9 w-9 rounded-xl border-border/30">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Active Users ({activeUsers.length || 1})
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeUsers.length > 0 ? activeUsers.map((u, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 bg-muted/40 border border-border/20 rounded-lg font-medium flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-green-500" /> {u}
                    </span>
                  )) : (
                    <span className="text-xs px-2.5 py-1 bg-muted/40 border border-border/20 rounded-lg font-medium flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-green-500" /> {userName} (you)
                    </span>
                  )}
                </div>
              </div>

              {typingUsers.length > 0 && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              )}

              <Button variant="outline" onClick={leaveRoom} className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                Leave Room
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CollaborationRoom;
