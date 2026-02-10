import RegisterForm from "./RegisterForm";
import SocialButtons from "../components/SocialButtons";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glow"></div>
        <div className="absolute top-40 -left-20 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glow animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-glow animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg">
              <Image
                src="/fox.png"
                alt="Kitsune"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Регистрация</h1>
            <p className="text-gray-300">Создайте свой аккаунт</p>
          </div>

          <RegisterForm />

          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-4 text-gray-400 text-sm">или</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          <SocialButtons isLogin={false} />

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Уже есть аккаунт?{" "}
              <Link
                href="/auth/login"
                className="text-purple-300 hover:text-white font-semibold transition-colors duration-300"
              >
                Войти
              </Link>
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-gray-500 hover:text-white transition-colors duration-300"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}