import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, BarChart3, Users, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpen size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">EduFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Class Management <br />
            <span className="text-emerald-600">Reimagined with Chat</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-500 mb-10">
            Streamline your teaching, connect with students in real-time, and manage assignments effortlessly. The all-in-one platform for modern education.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-lg font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-105"
            >
              Get Started for Free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Users size={24} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Seamless Class Management</h3>
              <p className="text-gray-500">
                Create classes, enroll students via simple codes, and organize your curriculum in one central hub.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <MessageCircle size={24} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Real-time Chat & Collaboration</h3>
              <p className="text-gray-500">
                Instant messaging for students and teachers. dedicated channels for class discussions and private support.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <BarChart3 size={24} />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">Grading & Assignments</h3>
              <p className="text-gray-500">
                Create assignments, accept submissions, and provide detailed feedback with our intuitive grading interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-emerald-900 py-16 px-8 text-center sm:px-16">
            <h2 className="text-3xl font-bold text-white mb-8">Empowering Education</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-emerald-400">100+</div>
                <div className="mt-2 text-emerald-100">Active Classes</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-400">5k+</div>
                <div className="mt-2 text-emerald-100">Assignments Graded</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-400">24/7</div>
                <div className="mt-2 text-emerald-100">Student Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
               <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-600 text-white">
                 <BookOpen size={14} />
               </div>
               <span className="font-semibold text-gray-900">EduFlow</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Class Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
