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
    { icon: Brain, text: "AIが内容を分析中", color: "text-purple-300" },
    { icon: Sparkles, text: "最適なカードを設計中", color: "text-blue-300" },
    { icon: Zap, text: "学習効果を最大化中", color: "text-green-300" },
    { icon: Stars, text: "デッキを完成中", color: "text-yellow-300" },
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
    <div className="relative bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 rounded-2xl p-4 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Main Container with proper padding and spacing */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 text-center space-y-6">
          
          {/* Main Loading Animation */}
          <div className="relative">
            {/* Outer Ring */}
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 border-3 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              
              {/* Inner Ring */}
              <div className="absolute inset-3 border-3 border-blue-200 rounded-full"></div>
              <div className="absolute inset-3 border-3 border-transparent border-t-blue-500 rounded-full animate-spin-reverse"></div>
              
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-float`}
                  style={{
                    left: `${25 + (i * 15)}%`,
                    top: `${35 + (i % 2) * 30}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-800 leading-tight">
              {message}
              <span className="text-purple-500">{dots}</span>
            </h2>
          </div>

          {/* Step Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      index === currentStep
                        ? `bg-gradient-to-r from-purple-500 to-blue-500 text-white scale-110 shadow-lg`
                        : index < currentStep
                        ? `bg-green-500 text-white shadow-md`
                        : `bg-gray-200 text-gray-400`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                );
              })}
            </div>
            
            <p className={`text-sm font-medium transition-all duration-500 ${steps[currentStep].color} px-2`}>
              {steps[currentStep].text}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% 完了
            </p>
          </div>

          {/* Fun Facts */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 space-y-2">
            <div className="text-xs text-gray-600 space-y-1">
              <p className="animate-fade-in-up flex items-center justify-center space-x-2">
                <span>💡</span>
                <span>AIが最適な学習パターンを分析中</span>
              </p>
              <p className="animate-fade-in-up animation-delay-1000 flex items-center justify-center space-x-2">
                <span>🧠</span>
                <span>記憶に残りやすいカード構成を設計中</span>
              </p>
              <p className="animate-fade-in-up animation-delay-2000 flex items-center justify-center space-x-2">
                <span>✨</span>
                <span>あなた専用の学習デッキを作成中</span>
              </p>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <p className="text-xs text-gray-400 font-medium">
              推定残り時間: 30-60秒
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 