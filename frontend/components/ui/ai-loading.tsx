"use client";

import { useEffect, useState } from "react";
import { Sparkles, Brain, Zap, Stars } from "lucide-react";

interface AILoadingProps {
  message?: string;
}

export default function AILoading({ message = "AIがデッキとカードを生成中..." }: AILoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  const steps = [
    { icon: Brain, text: "AIが内容を分析中", color: "text-purple-500" },
    { icon: Sparkles, text: "最適なカードを設計中", color: "text-blue-500" },
    { icon: Zap, text: "学習効果を最大化中", color: "text-green-500" },
    { icon: Stars, text: "デッキを完成中", color: "text-yellow-500" },
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main Loading Animation */}
        <div className="relative mb-8">
          {/* Outer Ring */}
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            
            {/* Inner Ring */}
            <div className="absolute inset-4 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-4 border-4 border-transparent border-t-blue-500 rounded-full animate-spin-reverse"></div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-float`}
                style={{
                  left: `${20 + (i * 12)}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {message}
          <span className="text-purple-500">{dots}</span>
        </h2>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    index === currentStep
                      ? `bg-gradient-to-r from-purple-500 to-blue-500 text-white scale-110`
                      : index < currentStep
                      ? `bg-green-500 text-white`
                      : `bg-gray-200 text-gray-400`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              );
            })}
          </div>
          
          <p className={`text-lg font-medium transition-all duration-500 ${steps[currentStep].color}`}>
            {steps[currentStep].text}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>

        {/* Fun Facts */}
        <div className="text-sm text-gray-600 space-y-2">
          <p className="animate-fade-in-up">💡 AIが最適な学習パターンを分析しています</p>
          <p className="animate-fade-in-up animation-delay-1000">🧠 記憶に残りやすいカード構成を設計中</p>
          <p className="animate-fade-in-up animation-delay-2000">✨ あなた専用の学習デッキを作成中</p>
        </div>
      </div>
    </div>
  );
}
