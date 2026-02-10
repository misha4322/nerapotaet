"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Navbar({ session }: { session: any }) {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="logo" href="/">🎮 GameHub</Link>

        <nav className="nav-links">
          <Link href="/">Главная</Link>
          <Link href="/posts">Форум</Link>
          <Link href="/posts/new">Создать пост</Link>
        </nav>

        <div className="nav-right">
          {session ? (
            <>
              <Link className="profile-chip" href="/profile">
                <span className="chip-avatar">
                  {(session.user?.name?.[0] ?? "U").toUpperCase()}
                </span>
                Профиль
              </Link>

              <button
                className="btn btn-ghost"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" href="/auth/login">Войти</Link>
              <Link className="btn btn-primary" href="/auth/register">Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
