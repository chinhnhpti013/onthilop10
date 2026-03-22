/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  LayoutDashboard, 
  PenTool, 
  Trophy, 
  MessageSquare, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Brain,
  Search,
  Moon,
  Sun,
  FileText,
  ArrowLeft,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { MOCK_DATA, Question, UserProgress } from './types';
import { getAITutorResponse, analyzeMistake, generateExamSummary } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

// --- Components ---

const Card = ({ children, className = "", id, onClick }: { children: React.ReactNode, className?: string, id?: string, onClick?: () => void }) => (
  <div id={id} onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, id }: any) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
  };
  return (
    <button 
      id={id}
      disabled={disabled}
      onClick={onClick} 
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'literature' | 'english'>('math');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('onthi10_progress');
    return saved ? JSON.parse(saved) : { completedLessons: [], examHistory: [], weakTopics: [] };
  });

  // Exam State
  const [isExamining, setIsExamining] = useState(false);
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState<any>(null);
  const [examSummary, setExamSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const filteredTheory = useMemo(() => {
    return MOCK_DATA[selectedSubject].theory.filter(t => 
      (selectedTopic === 'all' || t.title.includes(selectedTopic)) &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedSubject, searchQuery, selectedTopic]);

  const filteredQuestions = useMemo(() => {
    return MOCK_DATA[selectedSubject].questions.filter(q => 
      (selectedTopic === 'all' || q.topic === selectedTopic) &&
      (q.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedSubject, searchQuery, selectedTopic]);

  const topics = useMemo(() => {
    const t = new Set(MOCK_DATA[selectedSubject].theory.map(item => item.title.split(',')[0].split('(')[0].trim()));
    return ['all', ...Array.from(t)];
  }, [selectedSubject]);

  const exportPDF = () => {
    window.print();
  };

  const leaderboard = [
    { name: 'Nguyễn Văn A', score: 9.8, rank: 1 },
    { name: 'Trần Thị B', score: 9.5, rank: 2 },
    { name: 'Lê Văn C', score: 9.2, rank: 3 },
    { name: 'Phạm Thị D', score: 8.9, rank: 4 },
    { name: 'Bạn', score: progress.examHistory.length ? (progress.examHistory.reduce((a, b) => a + b.score, 0) / progress.examHistory.length).toFixed(1) : 0, rank: '-' },
  ];

  const handleAnalyzeMistake = async (q: any) => {
    setIsChatOpen(true);
    setIsTyping(true);
    setChatMessages(prev => [...prev, { role: 'user', text: `Hãy phân tích lỗi sai của mình ở câu: "${q.content}". Mình đã chọn "${q.userAnswer}" nhưng đáp án đúng là "${q.answer}".` }]);
    const analysis = await analyzeMistake(q.content, q.userAnswer, q.answer);
    setChatMessages(prev => [...prev, { role: 'ai', text: analysis || "" }]);
    setIsTyping(false);
  };

  useEffect(() => {
    localStorage.setItem('onthi10_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (isExamining && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (isExamining && timeLeft === 0) {
      finishExam();
    }
  }, [isExamining, timeLeft]);

  const startExam = (subject: 'math' | 'literature' | 'english', difficulty: string) => {
    const questions = MOCK_DATA[subject].questions.filter(q => q.difficulty === difficulty || difficulty === 'all');
    setCurrentExam({
      id: Date.now().toString(),
      subject,
      questions: questions.sort(() => Math.random() - 0.5).slice(0, 5),
      duration: 15 * 60 // 15 mins for mock
    });
    setTimeLeft(15 * 60);
    setExamAnswers({});
    setIsExamining(true);
    setExamResult(null);
    setExamSummary(null);
  };

  const finishExam = async () => {
    setIsExamining(false);
    let score = 0;
    const results = currentExam.questions.map((q: Question) => {
      const isCorrect = examAnswers[q.id] === q.answer;
      if (isCorrect) score += 2; // 5 questions, 10 points max
      return { ...q, isCorrect, userAnswer: examAnswers[q.id] };
    });

    const finalScore = score;
    const newHistory = {
      examId: currentExam.id,
      score: finalScore,
      date: new Date().toLocaleDateString(),
      subject: currentExam.subject
    };

    setProgress(prev => ({
      ...prev,
      examHistory: [...prev.examHistory, newHistory]
    }));

    setExamResult({ score: finalScore, results });
    
    setIsSummarizing(true);
    const summary = await generateExamSummary(currentExam.subject, finalScore, results);
    setExamSummary(summary || "Không thể tạo tóm tắt vào lúc này.");
    setIsSummarizing(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);
    
    const aiResponse = await getAITutorResponse(userMsg);
    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse || "" }]);
    setIsTyping(false);
  };

  const statsData = useMemo(() => {
    return progress.examHistory.slice(-5).map(h => ({
      name: h.date,
      score: h.score
    }));
  }, [progress]);

  const subjectStats = useMemo(() => {
    const subjects = ['math', 'literature', 'english'];
    return subjects.map(s => {
      const scores = progress.examHistory.filter(h => h.subject === s).map(h => h.score);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
      return { name: s === 'math' ? 'Toán' : s === 'literature' ? 'Văn' : 'Anh', value: Number(avg) };
    });
  }, [progress]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden lg:flex flex-col z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <GraduationCap size={24} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Ôn Thi 10 AI</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
            { id: 'subjects', icon: BookOpen, label: 'Môn học' },
            { id: 'exams', icon: PenTool, label: 'Luyện đề' },
            { id: 'results', icon: Trophy, label: 'Kết quả' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsExamining(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            {isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8 pb-24">
        
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h1 className="font-bold text-xl">Ôn Thi 10 AI</h1>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isExamining ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={() => setIsExamining(false)} className="flex items-center gap-2">
                  <ArrowLeft size={18} /> Thoát
                </Button>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <Clock size={20} className="text-blue-600" />
                  <span className="font-mono text-xl font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                {currentExam.questions.map((q: Question, idx: number) => (
                  <Card key={q.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-medium mb-6">{q.content}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options?.map(opt => (
                            <button
                              key={opt}
                              onClick={() => setExamAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                examAnswers[q.id] === opt
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button onClick={finishExam} className="w-full py-4 text-lg shadow-lg shadow-blue-200 dark:shadow-none">
                  Nộp bài và chấm điểm
                </Button>
              </div>
            </motion.div>
          ) : examResult ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="p-8 text-center mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
                <Trophy size={64} className="mx-auto mb-4 text-yellow-400" />
                <h2 className="text-3xl font-bold mb-2">Kết quả: {examResult.score}/10</h2>
                <p className="opacity-90">Bạn đã hoàn thành bài thi thử môn {currentExam.subject === 'math' ? 'Toán' : currentExam.subject === 'literature' ? 'Văn' : 'Anh'}</p>
                
                {/* AI Summary Section */}
                <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/20 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={20} className="text-yellow-300" />
                    <span className="font-bold text-sm uppercase tracking-wider">Nhận xét từ AI</span>
                  </div>
                  {isSummarizing ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                      <span className="text-sm opacity-70">Đang phân tích kết quả...</span>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed opacity-90">
                      <ReactMarkdown>
                        {examSummary || ""}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="secondary" onClick={() => setExamResult(null)}>Làm đề khác</Button>
                  <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => setActiveTab('dashboard')}>Về Dashboard</Button>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="font-bold text-xl mb-4">Chi tiết bài làm</h3>
                {examResult.results.map((r: any, idx: number) => (
                  <Card key={r.id} className="p-6">
                    <div className="flex items-start gap-4">
                      {r.isCorrect ? <CheckCircle2 className="text-green-500 shrink-0" /> : <XCircle className="text-red-500 shrink-0" />}
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-medium mb-2">{idx + 1}. {r.content}</p>
                          {!r.isCorrect && (
                            <Button variant="ghost" className="text-blue-600 p-1 h-auto" onClick={() => handleAnalyzeMistake(r)}>
                              <Brain size={16} className="mr-1" /> Phân tích lỗi
                            </Button>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-slate-500">Câu trả lời của bạn: <span className={r.isCorrect ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{r.userAnswer || 'Chưa trả lời'}</span></p>
                          {!r.isCorrect && <p className="text-green-600 font-bold">Đáp án đúng: {r.answer}</p>}
                        </div>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm italic">
                          <p className="font-semibold mb-1">Giải thích:</p>
                          {r.explanation}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Chào mừng trở lại! 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400">Hôm nay chúng ta sẽ ôn tập môn gì nào?</p>
                  </header>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-2xl">
                        <PenTool size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Đã làm</p>
                        <p className="text-2xl font-bold">{progress.examHistory.length} đề</p>
                      </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-600 rounded-2xl">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Điểm TB</p>
                        <p className="text-2xl font-bold">
                          {progress.examHistory.length ? (progress.examHistory.reduce((a, b) => a + b.score, 0) / progress.examHistory.length).toFixed(1) : 0}
                        </p>
                      </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 rounded-2xl">
                        <Brain size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Chuyên đề yếu</p>
                        <p className="text-2xl font-bold">{progress.weakTopics.length || 0}</p>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress Chart */}
                    <Card className="p-6">
                      <h3 className="font-bold text-lg mb-6">Tiến độ điểm số</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={statsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 10]} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 6, fill: '#2563eb' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Subject Stats */}
                    <Card className="p-6">
                      <h3 className="font-bold text-lg mb-6">Năng lực theo môn</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {subjectStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#2563eb', '#10b981', '#8b5cf6'][index]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  {/* Recommended Path */}
                  <Card className="p-8 bg-blue-600 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-4">Lộ trình học tập cá nhân hóa</h3>
                      <p className="opacity-90 mb-6 max-w-xl">AI đã phân tích kết quả của bạn. Bạn nên tập trung ôn tập phần "Căn bậc hai" và "Passive Voice" để cải thiện điểm số.</p>
                      <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => setActiveTab('subjects')}>Bắt đầu học ngay</Button>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                      <GraduationCap size={200} />
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar flex-1">
                      {[
                        { id: 'math', label: 'Toán học', icon: '➗' },
                        { id: 'literature', label: 'Ngữ văn', icon: '✍️' },
                        { id: 'english', label: 'Tiếng Anh', icon: '🇬🇧' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedSubject(s.id as any); setSelectedTopic('all'); }}
                          className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
                            selectedSubject === s.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span>{s.icon}</span>
                          <span className="font-semibold">{s.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm bài học..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {topics.map(topic => (
                      <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          selectedTopic === topic
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {topic === 'all' ? 'Tất cả chuyên đề' : topic}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <h3 className="font-bold text-xl">Lý thuyết trọng tâm</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTheory.length > 0 ? filteredTheory.map(t => (
                          <Card key={t.id} className="p-6 hover:border-blue-300 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <FileText size={20} />
                              </div>
                              {progress.completedLessons.includes(t.id) && <CheckCircle2 size={20} className="text-green-500" />}
                            </div>
                            <h4 className="font-bold mb-2 group-hover:text-blue-600 transition-colors">{t.title}</h4>
                            <p className="text-sm text-slate-500 line-clamp-2">{t.content}</p>
                            <div className="mt-4 flex items-center text-blue-600 text-sm font-semibold">
                              Học ngay <ChevronRight size={16} />
                            </div>
                          </Card>
                        )) : (
                          <div className="col-span-full py-12 text-center text-slate-400">Không tìm thấy bài học nào.</div>
                        )}
                      </div>

                      <h3 className="font-bold text-xl mt-8">Bài tập tự luyện</h3>
                      <div className="space-y-4">
                        {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                          <Card key={q.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-600' : 
                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {q.difficulty}
                              </span>
                              <span className="text-xs text-slate-400">{q.topic}</span>
                            </div>
                            <p className="font-medium mb-4">{q.content}</p>
                            <Button variant="outline" className="w-full" onClick={() => {
                              setIsChatOpen(true);
                              setIsTyping(true);
                              setChatMessages(prev => [...prev, { role: 'user', text: `Hãy hướng dẫn mình giải câu: "${q.content}"` }]);
                              getAITutorResponse(`Hãy hướng dẫn mình giải chi tiết câu này, cho ví dụ minh họa và bài tập tương tự: "${q.content}"`).then(res => {
                                setChatMessages(prev => [...prev, { role: 'ai', text: res || "" }]);
                                setIsTyping(false);
                              });
                            }}>Xem lời giải AI</Button>
                          </Card>
                        )) : (
                          <div className="py-12 text-center text-slate-400">Không tìm thấy bài tập nào.</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none">
                        <h3 className="font-bold text-lg mb-4">Thử thách hôm nay</h3>
                        <p className="text-sm opacity-90 mb-6">Hoàn thành 5 bài tập {selectedSubject === 'math' ? 'Toán' : 'Văn/Anh'} để nhận huy hiệu "Chăm chỉ".</p>
                        <div className="w-full bg-white/20 h-2 rounded-full mb-4">
                          <div className="bg-white h-full rounded-full" style={{ width: '40%' }}></div>
                        </div>
                        <p className="text-xs text-right opacity-80">2/5 bài tập</p>
                      </Card>

                      <Card className="p-6">
                        <h3 className="font-bold text-lg mb-4">Tài liệu PDF</h3>
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <FileText size={18} className="text-red-500" />
                                <span className="text-sm font-medium">Đề thi thử số {i}</span>
                              </div>
                              <ChevronRight size={16} className="text-slate-400" />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'exams' && (
                <div className="max-w-4xl mx-auto space-y-8">
                  <header className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Luyện đề thi thử</h2>
                    <p className="text-slate-500">Chọn môn học và mức độ để bắt đầu bài thi mô phỏng</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'math', label: 'Toán học', color: 'blue', icon: '➗' },
                      { id: 'literature', label: 'Ngữ văn', color: 'emerald', icon: '✍️' },
                      { id: 'english', label: 'Tiếng Anh', color: 'purple', icon: '🇬🇧' }
                    ].map(s => (
                      <Card key={s.id} className={`p-8 text-center hover:shadow-xl transition-all border-2 ${selectedSubject === s.id ? 'border-blue-600' : 'border-transparent'}`} onClick={() => setSelectedSubject(s.id as any)}>
                        <div className="text-5xl mb-4">{s.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{s.label}</h3>
                        <p className="text-sm text-slate-500 mb-6">Cấu trúc: 5 câu hỏi trắc nghiệm (Mô phỏng)</p>
                        <div className="space-y-2">
                          <Button className="w-full" onClick={() => startExam(s.id as any, 'easy')}>Dễ</Button>
                          <Button variant="secondary" className="w-full" onClick={() => startExam(s.id as any, 'medium')}>Trung bình</Button>
                          <Button variant="outline" className="w-full" onClick={() => startExam(s.id as any, 'hard')}>Khó</Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Card className="p-6 bg-slate-100 dark:bg-slate-800 border-dashed border-2 border-slate-300 dark:border-slate-600">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm">
                        <Brain size={40} className="text-blue-600" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="font-bold text-lg">AI Tạo đề thông minh</h4>
                        <p className="text-slate-500 text-sm">Hệ thống sẽ tự động tổng hợp các câu hỏi bạn hay làm sai để tạo thành một đề thi riêng biệt.</p>
                      </div>
                      <Button>Tạo đề ngay</Button>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'results' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Lịch sử làm bài</h2>
                    <Button variant="outline" onClick={exportPDF} className="flex items-center gap-2">
                      <FileText size={18} /> Xuất PDF
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      {progress.examHistory.length === 0 ? (
                        <Card className="p-12 text-center">
                          <PenTool size={48} className="mx-auto mb-4 text-slate-300" />
                          <p className="text-slate-500">Bạn chưa làm bài thi nào. Hãy bắt đầu luyện tập ngay!</p>
                          <Button className="mt-4" onClick={() => setActiveTab('exams')}>Luyện đề ngay</Button>
                        </Card>
                      ) : (
                        progress.examHistory.slice().reverse().map((h, idx) => (
                          <Card key={idx} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${
                                h.subject === 'math' ? 'bg-blue-100 text-blue-600' : 
                                h.subject === 'literature' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                                {h.subject === 'math' ? 'Toán' : h.subject === 'literature' ? 'Văn' : 'Anh'}
                              </div>
                              <div>
                                <h4 className="font-bold">Bài thi thử #{h.examId.slice(-4)}</h4>
                                <p className="text-xs text-slate-400">{h.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-xl font-bold ${h.score >= 8 ? 'text-green-600' : h.score >= 5 ? 'text-blue-600' : 'text-red-600'}`}>
                                {h.score}/10
                              </p>
                              <p className="text-xs text-slate-400">Hoàn thành</p>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>

                    <div className="space-y-6">
                      <Card className="p-6">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <Trophy className="text-yellow-500" size={20} />
                          Bảng xếp hạng
                        </h3>
                        <div className="space-y-4">
                          {leaderboard.map((user, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${user.name === 'Bạn' ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200' : ''}`}>
                              <div className="flex items-center gap-3">
                                <span className={`w-6 text-center font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                                  {user.rank}
                                </span>
                                <span className="text-sm font-medium">{user.name}</span>
                              </div>
                              <span className="font-bold text-sm">{user.score}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* AI Chat Floating */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Brain size={18} />
                  </div>
                  <span className="font-bold">Gia sư AI</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center mt-10">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-slate-500 text-sm px-8">Chào bạn! Mình là gia sư AI. Bạn có câu hỏi nào về Toán, Văn hay Anh không?</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Hỏi bài tập..."
                  className="flex-1 bg-slate-100 dark:bg-slate-700 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                />
                <button 
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <MessageSquare size={24} />
        </button>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex lg:hidden items-center justify-around p-3 z-40">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'subjects', icon: BookOpen },
          { id: 'exams', icon: PenTool },
          { id: 'results', icon: Trophy },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setIsExamining(false); }}
            className={`p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400'}`}
          >
            <item.icon size={24} />
          </button>
        ))}
      </nav>

    </div>
  );
}
