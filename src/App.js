import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Clock, Award, BookOpen, Filter, Search, RotateCcw } from 'lucide-react';

// Supabase API helper functions
const supabaseUrl = "https://mfdycbuoabbrtqkdhief.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljYnVvYWJicnRxa2RoaWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTk3NDAsImV4cCI6MjA2ODEzNTc0MH0.KMTUfQprfhGeutG5A79oPf2xUXYSFxzwTPTYQI45xFQ";

const supabaseAPI = {
  from(table) {
    return {
      select: (columns = '*') => ({
        order: (column, options = {}) => ({
          execute: async () => {
            try {
              const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}&order=${column}.${options.ascending !== false ? 'asc' : 'desc'}`;
              const response = await fetch(url, {
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        }),
        execute: async () => {
          try {
            const url = `${supabaseUrl}/rest/v1/${table}?select=${columns}`;
            const response = await fetch(url, {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { data, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    };
  }
};

// Enhanced Styles
const styles = {
  gradientBg: {
    background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 25%, #f0f0ff 50%, #f5f0ff 75%, #fff0ff 100%)',
    minHeight: '100vh',
    padding: '2rem 0'
  },
  mainCard: {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '2rem',
    marginBottom: '2rem',
    border: '1px solid #f3f4f6'
  },
  titleGradient: {
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  iconBg: {
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    borderRadius: '50%',
    padding: '1rem',
    marginRight: '1rem'
  },
  filterSection: {
    background: '#f9fafb',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: (color) => ({
    background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)`,
    borderRadius: '16px',
    padding: '1.5rem',
    color: 'white',
    textAlign: 'center',
    transform: 'scale(1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 10px 25px -12px rgba(0, 0, 0, 0.25)',
  }),
  statCardHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.35)'
  },
  featureCard: (bgColor, borderColor) => ({
    background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}99 100%)`,
    borderRadius: '16px',
    padding: '1.5rem',
    border: `1px solid ${borderColor}`
  }),
  startButton: {
    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    color: 'white',
    fontWeight: 'bold',
    padding: '1.5rem 3rem',
    borderRadius: '16px',
    fontSize: '1.25rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
    boxShadow: '0 10px 25px -12px rgba(0, 0, 0, 0.25)',
    position: 'relative',
    overflow: 'hidden'
  }
};

const GCPMLQuiz = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Timer effect
  useEffect(() => {
    let interval;
    if (quizStarted && !showResults) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, showResults]);

  // Load data from Supabase
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const questionsResult = await supabaseAPI.from('questions').select('*').order('id').execute();
        if (questionsResult.error) throw questionsResult.error;

        const categoriesResult = await supabaseAPI.from('categories').select('*').order('name').execute();
        if (categoriesResult.error) throw categoriesResult.error;

        setQuestions(questionsResult.data || []);
        setCategories(categoriesResult.data || []);
        setFilteredQuestions(questionsResult.data || []);
      } catch (error) {
        console.error('Error loading quiz data:', error);
        const sampleQuestions = [
          {
            id: 1,
            question: "What is the primary purpose of Vertex AI in Google Cloud?",
            options: ["Data storage and retrieval", "Machine learning model development and deployment", "Network security management", "Database administration"],
            correct_answer: 2,
            explanation: "Vertex AI is Google Cloud's unified ML platform for building, training, and deploying machine learning models at scale.",
            category: "Vertex AI",
            difficulty: "Easy"
          },
          {
            id: 2,
            question: "Which BigQuery ML function is used for model training?",
            options: ["ML.PREDICT", "ML.EVALUATE", "CREATE MODEL", "ML.TRAINING_INFO"],
            correct_answer: 3,
            explanation: "CREATE MODEL is the BigQuery ML statement used to create and train machine learning models directly in BigQuery.",
            category: "BigQuery ML",
            difficulty: "Medium"
          }
        ];
        setQuestions(sampleQuestions);
        setFilteredQuestions(sampleQuestions);
        setCategories([
          { id: 1, name: 'Vertex AI' },
          { id: 2, name: 'BigQuery ML' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, []);

  // Filter questions
  useEffect(() => {
    let filtered = questions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
    setCurrentQuestion(0);
  }, [selectedCategory, selectedDifficulty, searchTerm, questions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [filteredQuestions[currentQuestion].id]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const finishQuiz = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setQuizStarted(false);
    setTimeElapsed(0);
    setShowExplanation(false);
  };

  const calculateScore = () => {
    let correct = 0;
    filteredQuestions.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      const correctAnswer = question.correct_answer;
      
      let isCorrect = false;
      if (typeof correctAnswer === 'number') {
        const answerIndex = userAnswer ? ['A', 'B', 'C', 'D'].indexOf(userAnswer) + 1 : 0;
        isCorrect = answerIndex === correctAnswer;
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
      
      if (isCorrect) correct++;
    });
    return Math.round((correct / filteredQuestions.length) * 100);
  };

  if (loading) {
    return (
      <div style={{...styles.gradientBg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{color: '#6b7280'}}>Loading your GCP ML Engineer Quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div style={styles.gradientBg}>
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}>
          <div style={styles.mainCard}>
            {/* Enhanced Header */}
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem'}}>
                <div style={styles.iconBg}>
                  <BookOpen style={{width: '48px', height: '48px', color: 'white'}} />
                </div>
                <h1 style={styles.titleGradient}>
                  GCP ML Engineer Certification Quiz
                </h1>
              </div>
              <p style={{fontSize: '1.5rem', color: '#6b7280', marginBottom: '1rem'}}>
                Master Google Cloud Machine Learning with {filteredQuestions.length} comprehensive questions
              </p>
              <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.875rem', color: '#9ca3af', flexWrap: 'wrap'}}>
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <Award style={{width: '16px', height: '16px', marginRight: '0.25rem'}} />
                  Professional Level
                </span>
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <Clock style={{width: '16px', height: '16px', marginRight: '0.25rem'}} />
                  Self-Paced
                </span>
                <span style={{display: 'flex', alignItems: 'center'}}>
                  <BookOpen style={{width: '16px', height: '16px', marginRight: '0.25rem'}} />
                  Real Exam Scenarios
                </span>
              </div>
            </div>

            {/* Enhanced Filters */}
            <div style={styles.filterSection}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', textAlign: 'center'}}>
                🎯 Customize Your Quiz Experience
              </h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}}>
                    <Filter style={{width: '16px', height: '16px', display: 'inline', marginRight: '0.5rem'}} />
                    Category Focus
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1.125rem',
                      outline: 'none',
                      transition: 'border-color 0.3s'
                    }}
                  >
                    <option value="all">🌐 All Categories ({questions.length})</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        📂 {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}}>
                    <Award style={{width: '16px', height: '16px', display: 'inline', marginRight: '0.5rem'}} />
                    Difficulty Level
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1.125rem',
                      outline: 'none'
                    }}
                  >
                    <option value="all">🎯 All Levels</option>
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}}>
                    <Search style={{width: '16px', height: '16px', display: 'inline', marginRight: '0.5rem'}} />
                    Search Topics
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Search questions..."
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1.125rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Stats Dashboard */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
              {[
                {color: {from: '#3b82f6', to: '#2563eb'}, icon: BookOpen, number: filteredQuestions.length, label: 'Questions Ready', badge: '📊 Comprehensive Coverage'},
                {color: {from: '#10b981', to: '#059669'}, icon: Award, number: categories.length, label: 'ML Categories', badge: '🎯 Targeted Learning'},
                {color: {from: '#8b5cf6', to: '#7c3aed'}, icon: Clock, number: '∞', label: 'Time Limit', badge: '⏰ Self-Paced Study'},
                {color: {from: '#f59e0b', to: '#d97706'}, icon: () => <div style={{fontSize: '1.875rem'}}>🧠</div>, number: 'AI/ML', label: 'Focus Areas', badge: '🚀 Certification Ready'}
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.statCard(stat.color),
                    ...(hoveredCard === index ? styles.statCardHover : {})
                  }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <stat.icon style={{width: '48px', height: '48px', margin: '0 auto 0.75rem', opacity: 0.8}} />
                  <h3 style={{fontSize: '1.875rem', fontWeight: 'bold', margin: '0'}}>{stat.number}</h3>
                  <p style={{margin: '0.25rem 0', opacity: 0.9}}>{stat.label}</p>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem'
                  }}>
                    {stat.badge}
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Features */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
              <div style={styles.featureCard('#eef2ff', '#c7d2fe')}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#3730a3', marginBottom: '1rem'}}>🎯 Quiz Features</h3>
                <ul style={{margin: 0, padding: 0, listStyle: 'none', color: '#4338ca'}}>
                  {[
                    'Real GCP ML Engineer exam scenarios',
                    'Detailed explanations for every question',
                    'Progress tracking and instant feedback',
                    'Advanced filtering and search capabilities'
                  ].map((feature, index) => (
                    <li key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '0.75rem'}}>
                      <div style={{width: '8px', height: '8px', backgroundColor: '#6366f1', borderRadius: '50%', marginRight: '0.75rem'}}></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={styles.featureCard('#ecfdf5', '#bbf7d0')}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#14532d', marginBottom: '1rem'}}>📚 Topics Covered</h3>
                <ul style={{margin: 0, padding: 0, listStyle: 'none', color: '#15803d'}}>
                  {[
                    'Vertex AI & AutoML',
                    'BigQuery ML & Data Engineering',
                    'MLOps & Model Deployment',
                    'Computer Vision & NLP'
                  ].map((topic, index) => (
                    <li key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '0.75rem'}}>
                      <div style={{width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', marginRight: '0.75rem'}}></div>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enhanced Start Button */}
            <div style={{textAlign: 'center'}}>
              <div style={{marginBottom: '1rem'}}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#fefce8',
                  border: '1px solid #fde047',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem',
                  color: '#a16207'
                }}>
                  <Award style={{width: '16px', height: '16px', marginRight: '0.5rem'}} />
                  Ready to test your GCP ML expertise?
                </div>
              </div>
              
              <button
                onClick={() => setQuizStarted(true)}
                disabled={filteredQuestions.length === 0}
                style={{
                  ...styles.startButton,
                  opacity: filteredQuestions.length === 0 ? 0.5 : 1,
                  cursor: filteredQuestions.length === 0 ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (filteredQuestions.length > 0) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 10px 25px -12px rgba(0, 0, 0, 0.25)';
                }}
              >
                <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  🚀 Start Quiz ({filteredQuestions.length} questions)
                  <ChevronRight style={{width: '24px', height: '24px', marginLeft: '0.5rem'}} />
                </span>
              </button>
              
              {filteredQuestions.length === 0 && (
                <p style={{color: '#ef4444', marginTop: '1rem', fontSize: '1.125rem'}}>
                  ⚠️ No questions match your current filters. Try adjusting your selection.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div style={styles.gradientBg}>
        <div style={{maxWidth: '1024px', margin: '0 auto', padding: '0 1rem'}}>
          <div style={styles.mainCard}>
            <div style={{textAlign: 'center', marginBottom: '2rem'}}>
              <h1 style={{fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem'}}>
                🎉 Quiz Complete!
              </h1>
              <div style={{
                fontSize: '3.75rem',
                fontWeight: 'bold',
                color: score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626',
                marginBottom: '1rem'
              }}>
                {score}%
              </div>
              <p style={{fontSize: '1.25rem', color: '#6b7280'}}>
                You answered {Object.keys(selectedAnswers).filter(qId => {
                  const question = filteredQuestions.find(q => q.id === parseInt(qId));
                  const userAnswer = selectedAnswers[qId];
                  const correctAnswer = question?.correct_answer;
                  
                  if (typeof correctAnswer === 'number') {
                    const answerIndex = userAnswer ? ['A', 'B', 'C', 'D'].indexOf(userAnswer) + 1 : 0;
                    return answerIndex === correctAnswer;
                  }
                  return userAnswer === correctAnswer;
                }).length} out of {filteredQuestions.length} questions correctly
              </p>
              <p style={{color: '#9ca3af', marginTop: '0.5rem'}}>
                Time taken: {formatTime(timeElapsed)}
              </p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
              <div style={{backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: '#14532d', marginBottom: '0.5rem'}}>Correct Answers</h3>
                <p style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#22c55e', margin: 0}}>
                  {Object.keys(selectedAnswers).filter(qId => {
                    const question = filteredQuestions.find(q => q.id === parseInt(qId));
                    const userAnswer = selectedAnswers[qId];
                    const correctAnswer = question?.correct_answer;
                    
                    if (typeof correctAnswer === 'number') {
                      const answerIndex = userAnswer ? ['A', 'B', 'C', 'D'].indexOf(userAnswer) + 1 : 0;
                      return answerIndex === correctAnswer;
                    }
                    return userAnswer === correctAnswer;
                  }).length}
                </p>
              </div>
              <div style={{backgroundColor: '#fef2f2', borderRadius: '12px', padding: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: '#7f1d1d', marginBottom: '0.5rem'}}>Incorrect Answers</h3>
                <p style={{fontSize: '1.875rem', fontWeight: 'bold', color: '#ef4444', margin: 0}}>
                  {filteredQuestions.length - Object.keys(selectedAnswers).filter(qId => {
                    const question = filteredQuestions.find(q => q.id === parseInt(qId));
                    const userAnswer = selectedAnswers[qId];
                    const correctAnswer = question?.correct_answer;
                    
                    if (typeof correctAnswer === 'number') {
                      const answerIndex = userAnswer ? ['A', 'B', 'C', 'D'].indexOf(userAnswer) + 1 : 0;
                      return answerIndex === correctAnswer;
                    }
                    return userAnswer === correctAnswer;
                  }).length}
                </p>
              </div>
            </div>

            <div style={{textAlign: 'center'}}>
              <button
                onClick={resetQuiz}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                <RotateCcw style={{width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem'}} />
                Take Another Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = filteredQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / filteredQuestions.length) * 100;

  return (
    <div style={styles.gradientBg}>
      <div style={{maxWidth: '1024px', margin: '0 auto', padding: '0 1rem'}}>
        {/* Floating End Quiz Button */}
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={finishQuiz}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              fontWeight: 'bold',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 10px 25px -12px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 15px 35px -12px rgba(220, 38, 38, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 25px -12px rgba(220, 38, 38, 0.4)';
            }}
          >
            🏁 End Quiz
          </button>
        </div>

        {/* Header */}
        <div style={{...styles.mainCard, marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0}}>GCP ML Engineer Quiz</h1>
            <div style={{display: 'flex', alignItems: 'center', color: '#6b7280'}}>
              <Clock style={{width: '20px', height: '20px', marginRight: '0.5rem'}} />
              {formatTime(timeElapsed)}
            </div>
          </div>
          
          <div style={{marginBottom: '1rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>
              <span>Question {currentQuestion + 1} of {filteredQuestions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div style={{width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '8px'}}>
              <div style={{
                backgroundColor: '#2563eb',
                height: '8px',
                borderRadius: '9999px',
                width: `${progress}%`,
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div style={styles.mainCard}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem'}}>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: question.difficulty === 'Easy' ? '#dcfce7' : question.difficulty === 'Medium' ? '#fef3c7' : '#fecaca',
              color: question.difficulty === 'Easy' ? '#166534' : question.difficulty === 'Medium' ? '#92400e' : '#991b1b'
            }}>
              {question.difficulty}
            </span>
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px'
            }}>
              {question.category}
            </span>
          </div>

          <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem'}}>{question.question}</h2>

          <div style={{marginBottom: '1.5rem'}}>
            {['A', 'B', 'C', 'D'].map((letter, index) => {
              let optionText = '';
              if (question.options) {
                if (Array.isArray(question.options)) {
                  optionText = question.options[index] || `Option ${letter} - Loading...`;
                } else if (typeof question.options === 'object') {
                  optionText = question.options[letter] || question.options[letter.toLowerCase()] || question.options[index] || `Option ${letter} - Loading...`;
                }
              } else {
                optionText = question[`option_${letter.toLowerCase()}`] || `Option ${letter} - Loading...`;
              }

              const isSelected = selectedAnswers[question.id] === letter;

              return (
                <div key={letter} style={{width: '100%', marginBottom: '1rem'}}>
                  <button
                    onClick={() => handleAnswerSelect(letter)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      textAlign: 'left',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = '#9ca3af';
                        e.target.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = '#ffffff';
                      }
                    }}
                  >
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <span style={{fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem'}}>{letter}.</span>
                      <span style={{lineHeight: '1.6'}}>{optionText}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div style={{
              backgroundColor: '#eff6ff',
              borderLeft: '4px solid #2563eb',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{fontWeight: 'bold', color: '#1e40af', marginBottom: '0.5rem', margin: '0 0 0.5rem 0'}}>Explanation:</h3>
              <p style={{color: '#1d4ed8', margin: 0}}>{question.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                color: currentQuestion === 0 ? '#9ca3af' : '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                transition: 'color 0.3s'
              }}
            >
              <ChevronLeft style={{width: '20px', height: '20px', marginRight: '0.25rem'}} />
              Previous
            </button>

            <div style={{display: 'flex', gap: '0.75rem'}}>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#eab308',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#ca8a04'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#eab308'}
              >
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </button>

              {currentQuestion === filteredQuestions.length - 1 ? (
                <button
                  onClick={finishQuiz}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '1.125rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 25px -12px rgba(0, 0, 0, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#15803d';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 15px 35px -12px rgba(0, 0, 0, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#16a34a';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 10px 25px -12px rgba(0, 0, 0, 0.25)';
                  }}
                >
                  🏁 Finish Quiz
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1.5rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Next
                  <ChevronRight style={{width: '20px', height: '20px', marginLeft: '0.25rem'}} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GCPMLQuiz;