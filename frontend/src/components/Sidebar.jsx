import { NavLink } from "react-router-dom";
import Logo from "./Logo";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/nurses", label: "Nurses", icon: "👩‍⚕️" },
  { to: "/residents", label: "Residents", icon: "🧓" },
  { to: "/doses", label: "Today's doses", icon: "💊" },
  { to: "/attendance", label: "Attendance", icon: "🕒" },
  { to: "/complaints", label: "Complaints", icon: "💬" },
  { to: "/activity", label: "Activity log", icon: "📋" },
];

const nurseLinks = [
  { to: "/doses", label: "Today's doses", icon: "💊" },
  { to: "/residents", label: "Residents", icon: "🧓" },
  { to: "/attendance", label: "Attendance", icon: "🕒" },
];

const familyLinks = [
  { to: "/residents", label: "My relative", icon: "🧓" },
  { to: "/complaints", label: "Complaints", icon: "💬" },
];

const linksByRole = {
  admin: adminLinks,
  nurse: nurseLinks,
  family: familyLinks,
};

export default function Sidebar({ role = "admin" }) {
  const links = linksByRole[role] || adminLinks;

  return (
    <aside className="w-64 shrink-0 bg-[#0F766E] text-white min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/20">
        <div className="bg-white rounded-xl p-1">
          <Logo size={36} />
        </div>
        <span className="text-xl font-bold">MedRemind</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-lg ${
                isActive ? "bg-white text-[#0F766E] font-semibold" : "hover:bg-white/10"
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}