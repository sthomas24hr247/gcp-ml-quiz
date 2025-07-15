import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Clock, Award, BookOpen, Filter, Search, RotateCcw } from 'lucide-react';

// Supabase API helper functions
const supabaseUrl = "https://mfdycbuoabbrtqkdhief.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZHljYnVvYWJicnRxa2RoaWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTk3NDAsImV4cCI6MjA2ODEzNTc0MH0.KMTUfQprfhGeutG5A79oPf2xUXYSFxzwTPTYQI45xFQ";

const supabaseAPI = {
  async from(table) {
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
        // Fetch questions
        const questionsResult = await supabaseAPI.from('questions').select('*').order('id').execute();
        if (questionsResult.error) throw questionsResult.error;

        // Fetch categories
        const categoriesResult = await supabaseAPI.from('categories').select('*').order('name').execute();
        if (categoriesResult.error) throw categoriesResult.error;

        setQuestions(questionsResult.data || []);
        setCategories(categoriesResult.data || []);
        setFilteredQuestions(questionsResult.data || []);
      } catch (error) {
        console.error('Error loading quiz data:', error);
        // Fallback to comprehensive sample data for demo
        const sampleQuestions = [
          {
            id: 1,
            question: "What is the primary purpose of Vertex AI in Google Cloud?",
            option_a: "Data storage and retrieval",
            option_b: "Machine learning model development and deployment",
            option_c: "Network security management",
            option_d: "Database administration",
            correct_answer: "B",
            explanation: "Vertex AI is Google Cloud's unified ML platform for building, training, and deploying machine learning models at scale.",
            category: "Vertex AI",
            difficulty: "Easy"
          },
          {
            id: 2,
            question: "Which BigQuery ML function is used for model training?",
            option_a: "ML.PREDICT",
            option_b: "ML.EVALUATE",
            option_c: "CREATE MODEL",
            option_d: "ML.TRAINING_INFO",
            correct_answer: "C",
            explanation: "CREATE MODEL is the BigQuery ML statement used to create and train machine learning models directly in BigQuery.",
            category: "BigQuery ML",
            difficulty: "Medium"
          },
          {
            id: 3,
            question: "What is the maximum number of features AutoML Tables can handle?",
            option_a: "100 features",
            option_b: "500 features",
            option_c: "1000 features",
            option_d: "10000 features",
            correct_answer: "C",
            explanation: "AutoML Tables can handle up to 1000 features for structured data machine learning tasks.",
            category: "AutoML",
            difficulty: "Hard"
          },
          {
            id: 4,
            question: "Which Cloud ML service is best for real-time image classification?",
            option_a: "Cloud Vision API",
            option_b: "AutoML Vision",
            option_c: "Vertex AI Prediction",
            option_d: "All of the above",
            correct_answer: "D",
            explanation: "All three services can handle real-time image classification, but with different levels of customization and pre-built capabilities.",
            category: "Computer Vision",
            difficulty: "Medium"
          },
          {
            id: 5,
            question: "What is the recommended approach for A/B testing ML models in production?",
            option_a: "Deploy both models to the same endpoint",
            option_b: "Use traffic splitting in Vertex AI Endpoints",
            option_c: "Manually switch between models",
            option_d: "Use separate projects for each model",
            correct_answer: "B",
            explanation: "Vertex AI Endpoints support traffic splitting, allowing you to gradually route traffic between model versions for safe A/B testing.",
            category: "MLOps",
            difficulty: "Hard"
          }
        ];
        setQuestions(sampleQuestions);
        setFilteredQuestions(sampleQuestions);
        setCategories([
          { id: 1, name: 'Vertex AI' },
          { id: 2, name: 'BigQuery ML' },
          { id: 3, name: 'AutoML' },
          { id: 4, name: 'Computer Vision' },
          { id: 5, name: 'MLOps' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, []);

  // Filter questions based on category, difficulty, and search
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
      if (selectedAnswers[question.id] === question.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / filteredQuestions.length) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your GCP ML Engineer Quiz...</p>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🎯 GCP ML Engineer Certification Quiz
              </h1>
              <p className="text-xl text-gray-600">
                Master Google Cloud Machine Learning with 287 comprehensive questions
              </p>
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="inline w-4 h-4 mr-1" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories ({questions.length})</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="inline w-4 h-4 mr-1" />
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="inline w-4 h-4 mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quiz Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">{filteredQuestions.length}</h3>
                <p className="text-gray-600">Questions Available</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">{categories.length}</h3>
                <p className="text-gray-600">Categories</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-gray-900">∞</h3>
                <p className="text-gray-600">No Time Limit</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setQuizStarted(true)}
                disabled={filteredQuestions.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Quiz ({filteredQuestions.length} questions)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🎉 Quiz Complete!
              </h1>
              <div className={`text-6xl font-bold ${getScoreColor(score)} mb-4`}>
                {score}%
              </div>
              <p className="text-xl text-gray-600">
                You answered {Object.keys(selectedAnswers).filter(qId => {
                  const question = filteredQuestions.find(q => q.id === parseInt(qId));
                  return selectedAnswers[qId] === question?.correct_answer;
                }).length} out of {filteredQuestions.length} questions correctly
              </p>
              <p className="text-gray-500 mt-2">
                Time taken: {formatTime(timeElapsed)}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Correct Answers</h3>
                <p className="text-3xl font-bold text-green-600">
                  {Object.keys(selectedAnswers).filter(qId => {
                    const question = filteredQuestions.find(q => q.id === parseInt(qId));
                    return selectedAnswers[qId] === question?.correct_answer;
                  }).length}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Incorrect Answers</h3>
                <p className="text-3xl font-bold text-red-600">
                  {Object.keys(selectedAnswers).filter(qId => {
                    const question = filteredQuestions.find(q => q.id === parseInt(qId));
                    return selectedAnswers[qId] !== question?.correct_answer;
                  }).length}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={resetQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg mr-4 transition-colors"
              >
                <RotateCcw className="w-5 h-5 inline mr-2" />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">GCP ML Engineer Quiz</h1>
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              {formatTime(timeElapsed)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {filteredQuestions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)} mr-3`}>
              {question.difficulty}
            </span>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {question.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">{question.question}</h2>

          <div className="space-y-4 mb-6">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <button
                key={letter}
                onClick={() => handleAnswerSelect(letter)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers[question.id] === letter
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold mr-3">{letter}.</span>
                {question[`option_${letter.toLowerCase()}`]}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">Explanation:</h3>
              <p className="text-blue-700">{question.explanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
              >
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </button>

              {currentQuestion === filteredQuestions.length - 1 ? (
                <button
                  onClick={finishQuiz}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                >
                  Finish Quiz
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-1" />
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