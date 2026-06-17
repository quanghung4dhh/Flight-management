import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plane,
  User,
  LogOut,
  Settings,
  Ticket,
  Globe,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Plane className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SkyViet</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive("/") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {t("common.home")}
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className={`text-sm font-medium transition-colors ${
                  isActive("/my-bookings") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {t("common.myBookings")}
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${
                  isActive("/admin") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <span className="flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("common.admin")}
                </span>
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {i18n.language === "vi" ? "VI" : "EN"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage("vi")}>
                  {t("common.vietnamese")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  {t("common.english")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user?.name || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t("common.profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {t("common.myBookings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button size="sm">{t("common.login")}</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                {t("common.home")}
              </Link>
              {isAuthenticated && (
                <Link to="/my-bookings" className="text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  {t("common.myBookings")}
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  {t("common.admin")}
                </Link>
              )}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => changeLanguage("vi")}>VI</Button>
                <Button variant="outline" size="sm" onClick={() => changeLanguage("en")}>EN</Button>
              </div>
              {isAuthenticated ? (
                <Button variant="ghost" onClick={logout} className="justify-start text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("common.logout")}
                </Button>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm">{t("common.login")}</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
