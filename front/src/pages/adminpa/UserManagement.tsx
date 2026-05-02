import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  username: string;
  email: string;
  active: boolean;
  age?: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', age: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', active: true, age: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to access this page.');
      navigate('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/apilogin/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        setIsAdmin(data.is_admin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    fetchUsers(token);
  }, [navigate]);

  const fetchUsers = async (token: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/get_users/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) return fetchUsers(newToken);
        } else if (response.status === 404) {
          throw new Error('Endpoint /api/get_users/ not found. Check server configuration.');
        }
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json() as User[];
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError((error as Error).message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      alert('No refresh token found. Please log in again.');
      navigate('/login');
      return null;
    }
    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access);
        return data.access;
      } else {
        alert('Token refresh failed: ' + JSON.stringify(data));
        navigate('/login');
        return null;
      }
    } catch (error) {
      alert('Error refreshing token: ' + error);
      navigate('/login');
      return null;
    }
  };

  const handleAddUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!newUser.username || !newUser.email || !newUser.password) {
      alert('Username, email, and password are required.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/add_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            return fetch('http://localhost:8000/api/add_user/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(newUser),
            });
          }
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add user: ${response.statusText}`);
      }

      alert('User added successfully');
      setNewUser({ username: '', email: '', password: '', age: '' });
      fetchUsers(token);
    } catch (error) {
      console.error('Error adding user:', error);
      alert(`Failed to add user: ${error}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/user/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            return handleDelete(id);
          }
        }
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }

      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error}`);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      active: user.active,
      age: user.age || '',
    });
    setIsModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const updates = {
      username: editForm.username,
      email: editForm.email,
      active: editForm.active,
      age: editForm.age || null,
    };

    try {
      const response = await fetch(`http://localhost:8000/api/user/${selectedUser.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            return fetch(`http://localhost:8000/api/user/${selectedUser.id}/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(updates),
            });
          }
        }
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => (u.id === selectedUser.id ? updatedUser : u)));
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'active' ? value === 'true' : value,
    }));
  };

  if (loading) return <div className="text-center text-lg text-gray-400">Loading...</div>;
  if (error) return <div className="text-center text-lg text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">User Management</h1>
          <p className="text-gray-400 mt-2">Add, modify, or delete users here.</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </header>

      {/* Add User Section (Admin Only) */}
      {isAdmin && (
        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaPlus className="mr-2 text-blue-500" />
            Add New User
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={newUser.username}
              onChange={handleInputChange}
              className="p-3 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={newUser.email}
              onChange={handleInputChange}
              className="p-3 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newUser.password}
              onChange={handleInputChange}
              className="p-3 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="age"
              placeholder="Age (optional)"
              value={newUser.age}
              onChange={handleInputChange}
              className="p-3 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaPlus className="mr-2" />
            Add User
          </button>
        </section>
      )}

      {/* Users List */}
      <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Users List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-4">ID</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                {isAdmin && <th className="p-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-600">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        user.active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex items-center px-3 py-1 bg-blue-500 rounded hover:bg-blue-600"
                      >
                        <FaEdit className="mr-1" />
                        Modify
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex items-center px-3 py-1 bg-red-500 rounded hover:bg-red-600"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaEdit className="mr-2 text-blue-500" />
              Modify User
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="active"
                  value={editForm.active.toString()}
                  onChange={handleEditInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age (optional)</label>
                <input
                  type="number"
                  name="age"
                  value={editForm.age}
                  onChange={handleEditInputChange}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;