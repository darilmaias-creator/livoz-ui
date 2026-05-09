"use client";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FormEvent, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  role: string;
  createdAt: string;
  childrenCount: number;
};

type AdminUsersResponse = {
  message?: string;
  users?: AdminUser[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers(currentSearch = "") {
    setIsLoading(true);
    setError("");

    try {
      const params = currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : "";
      const response = await fetch(`/api/admin/users${params}`);
      const data = (await response.json()) as AdminUsersResponse;

      if (!response.ok || !data.users) {
        setError(data.message || "Não foi possível carregar os responsáveis.");
        return;
      }

      setUsers(data.users);
    } catch {
      setError("Não foi possível conectar ao Livoz agora.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadUsers(search.trim());
  }

  return (
    <AdminProtectedRoute>
      <AdminLayout
        title="Usuários"
        description="Responsáveis cadastrados na plataforma Livoz."
      >
        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-card">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-12 flex-1 rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="Buscar por nome, e-mail, telefone ou CPF"
            />
            <button
              type="submit"
              className="rounded-[18px] bg-livoz-blue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-livoz-navy"
            >
              Buscar
            </button>
          </form>
        </section>

        <section className="mt-5 rounded-[24px] border border-slate-100 bg-white shadow-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Carregando usuários...</div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-orange-700">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500">Nenhum usuário encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">CPF</th>
                    <th className="px-4 py-3">Crianças</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 font-bold text-slate-900">{user.name}</td>
                      <td className="px-4 py-4 text-slate-600">{user.email}</td>
                      <td className="px-4 py-4 text-slate-600">{user.phone || "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{user.cpf || "-"}</td>
                      <td className="px-4 py-4 text-slate-600">{user.childrenCount}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-livoz-navy">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
