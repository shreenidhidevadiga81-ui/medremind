import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-[#F0FDFA]">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <p className="text-slate-600 text-lg">
            Signed in as <span className="font-semibold text-[#0F172A]">{user.full_name}</span>{" "}
            <span className="capitalize text-sm bg-[#F0FDFA] text-[#0F766E] rounded-full px-3 py-1 ml-2">
              {user.role}
            </span>
          </p>
          <button
            onClick={onLogout}
            className="rounded-lg bg-[#0F766E] hover:bg-[#115e59] text-white font-semibold px-5 py-2"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}